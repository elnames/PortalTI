using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Security.Claims;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly PortalTiContext _context;

        public ChatController(PortalTiContext context)
        {
            _context = context;
        }

        // GET: api/chat/soporte-disponible
        [HttpGet("soporte-disponible")]
        public async Task<ActionResult<IEnumerable<object>>> GetSoporteDisponible()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            // Solo usuarios normales pueden ver la lista de soporte
            if (user.Role == "admin" || user.Role == "soporte")
                return BadRequest("Los administradores y soporte no pueden ver la lista de soporte");

            var soportes = await _context.AuthUsers
                .Where(u => (u.Role == "admin" || u.Role == "soporte") && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Role
                })
                .ToListAsync();

            return Ok(soportes);
        }

        // GET: api/chat/conversaciones
        [HttpGet("conversaciones")]
        public async Task<ActionResult<IEnumerable<object>>> GetConversaciones()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var query = _context.ChatConversaciones
                .Include(c => c.Usuario)
                .Include(c => c.Soporte)
                .Include(c => c.Mensajes.OrderByDescending(m => m.FechaCreacion).Take(1))
                .AsQueryable();

            // Filtrar según el rol del usuario
            if (user.Role == "admin" || user.Role == "soporte")
            {
                // Admin y soporte ven todas las conversaciones
                query = query.Where(c => c.Estado != "Cerrada");
            }
            else
            {
                // Usuarios normales solo ven sus propias conversaciones
                query = query.Where(c => c.UsuarioId == userId);
            }

            var conversaciones = await query
                .OrderByDescending(c => c.Mensajes.Any() ? c.Mensajes.First().FechaCreacion : c.FechaCreacion)
                .Select(c => new
                {
                    c.Id,
                    c.Titulo,
                    c.Descripcion,
                    c.Estado,
                    c.FechaCreacion,
                    c.FechaCierre,
                    Usuario = new
                    {
                        c.Usuario.Id,
                        c.Usuario.Username,
                        c.Usuario.Role
                    },
                    Soporte = c.Soporte != null ? new
                    {
                        c.Soporte.Id,
                        c.Soporte.Username,
                        c.Soporte.Role
                    } : null,
                    UltimoMensaje = c.Mensajes.Any() ? new
                    {
                        c.Mensajes.First().Contenido,
                        c.Mensajes.First().FechaCreacion,
                        c.Mensajes.First().EsInterno
                    } : null,
                    MensajesNoLeidos = c.Mensajes.Count(m => !m.EsLeido && m.CreadoPorId != userId),
                    c.TicketId
                })
                .ToListAsync();

            return Ok(conversaciones);
        }

        // GET: api/chat/conversaciones/{id}
        [HttpGet("conversaciones/{id}")]
        public async Task<ActionResult<object>> GetConversacion(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var conversacion = await _context.ChatConversaciones
                .Include(c => c.Usuario)
                .Include(c => c.Soporte)
                .Include(c => c.Ticket)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversacion == null)
                return NotFound();

            // Verificar permisos
            if (user.Role != "admin" && user.Role != "soporte" && conversacion.UsuarioId != userId)
                return Forbid();

            return Ok(new
            {
                conversacion.Id,
                conversacion.Titulo,
                conversacion.Descripcion,
                conversacion.Estado,
                conversacion.FechaCreacion,
                conversacion.FechaCierre,
                Usuario = new
                {
                    conversacion.Usuario.Id,
                    conversacion.Usuario.Username,
                    conversacion.Usuario.Role
                },
                Soporte = conversacion.Soporte != null ? new
                {
                    conversacion.Soporte.Id,
                    conversacion.Soporte.Username,
                    conversacion.Soporte.Role
                } : null,
                Ticket = conversacion.Ticket != null ? new
                {
                    conversacion.Ticket.Id,
                    conversacion.Ticket.Titulo,
                    conversacion.Ticket.Estado
                } : null
            });
        }

        // POST: api/chat/conversaciones
        [HttpPost("conversaciones")]
        public async Task<ActionResult<object>> CrearConversacion([FromBody] CrearConversacionRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            // Solo usuarios normales pueden crear conversaciones
            if (user.Role == "admin" || user.Role == "soporte")
                return BadRequest("Los administradores y soporte no pueden crear conversaciones");

            var conversacion = new ChatConversacion
            {
                Titulo = request.Titulo,
                Descripcion = request.Descripcion,
                UsuarioId = userId.Value,
                SoporteId = request.SoporteId,
                Estado = "Pendiente"
            };

            _context.ChatConversaciones.Add(conversacion);
            await _context.SaveChangesAsync();

            // Crear mensaje inicial si se proporciona
            if (!string.IsNullOrEmpty(request.MensajeInicial))
            {
                var mensaje = new ChatMensaje
                {
                    Contenido = request.MensajeInicial,
                    ConversacionId = conversacion.Id,
                    CreadoPorId = userId.Value
                };

                _context.ChatMensajes.Add(mensaje);
                await _context.SaveChangesAsync();
            }

            await LogActivity("Crear conversación de chat", $"Conversación '{request.Titulo}' creada");

            return CreatedAtAction(nameof(GetConversacion), new { id = conversacion.Id }, new
            {
                conversacion.Id,
                conversacion.Titulo,
                conversacion.Descripcion,
                conversacion.Estado,
                conversacion.FechaCreacion
            });
        }

        // GET: api/chat/conversaciones/{id}/mensajes
        [HttpGet("conversaciones/{id}/mensajes")]
        public async Task<ActionResult<IEnumerable<object>>> GetMensajes(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var conversacion = await _context.ChatConversaciones
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversacion == null)
                return NotFound();

            // Verificar permisos
            if (user.Role != "admin" && user.Role != "soporte" && conversacion.UsuarioId != userId)
                return Forbid();

            var mensajes = await _context.ChatMensajes
                .Include(m => m.CreadoPor)
                .Where(m => m.ConversacionId == id)
                .OrderBy(m => m.FechaCreacion)
                .Select(m => new
                {
                    m.Id,
                    m.Contenido,
                    m.FechaCreacion,
                    m.EsInterno,
                    m.EsLeido,
                    m.FechaLectura,
                    CreadoPor = new
                    {
                        m.CreadoPor.Id,
                        m.CreadoPor.Username,
                        m.CreadoPor.Role
                    }
                })
                .ToListAsync();

            // Filtrar mensajes internos según el rol
            if (user.Role != "admin" && user.Role != "soporte")
            {
                mensajes = mensajes.Where(m => !m.EsInterno).ToList();
            }

            return Ok(mensajes);
        }

        // POST: api/chat/conversaciones/{id}/mensajes
        [HttpPost("conversaciones/{id}/mensajes")]
        public async Task<ActionResult<object>> EnviarMensaje(int id, [FromBody] EnviarMensajeRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var conversacion = await _context.ChatConversaciones
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversacion == null)
                return NotFound();

            // Verificar permisos
            if (user.Role != "admin" && user.Role != "soporte" && conversacion.UsuarioId != userId)
                return Forbid();

            // Verificar que la conversación esté activa
            if (conversacion.Estado == "Cerrada")
                return BadRequest("No se pueden enviar mensajes a una conversación cerrada");

            var mensaje = new ChatMensaje
            {
                Contenido = request.Contenido,
                ConversacionId = id,
                CreadoPorId = userId.Value,
                EsInterno = request.EsInterno && (user.Role == "admin" || user.Role == "soporte")
            };

            _context.ChatMensajes.Add(mensaje);

            // Si es la primera vez que soporte responde, asignar soporte a la conversación
            if (conversacion.SoporteId == null && (user.Role == "admin" || user.Role == "soporte"))
            {
                conversacion.SoporteId = userId.Value;
                conversacion.Estado = "Activa";
            }

            await _context.SaveChangesAsync();

            await LogActivity("Enviar mensaje de chat", $"Mensaje enviado en conversación #{id}");

            return Ok(new
            {
                mensaje.Id,
                mensaje.Contenido,
                mensaje.FechaCreacion,
                mensaje.EsInterno,
                CreadoPor = new
                {
                    user.Id,
                    user.Username,
                    user.Role
                }
            });
        }

        // PUT: api/chat/conversaciones/{id}/asignar
        [HttpPut("conversaciones/{id}/asignar")]
        public async Task<ActionResult> AsignarSoporte(int id, [FromBody] AsignarSoporteRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            // Solo admin y soporte pueden asignar
            if (user.Role != "admin" && user.Role != "soporte")
                return Forbid();

            var conversacion = await _context.ChatConversaciones.FindAsync(id);
            if (conversacion == null)
                return NotFound();

            var soporte = await _context.AuthUsers.FindAsync(request.SoporteId);
            if (soporte == null || (soporte.Role != "admin" && soporte.Role != "soporte"))
                return BadRequest("Usuario de soporte no válido");

            conversacion.SoporteId = request.SoporteId;
            conversacion.Estado = "Activa";

            await _context.SaveChangesAsync();

            await LogActivity("Asignar soporte a conversación", $"Conversación #{id} asignada a {soporte.Username}");

            return Ok();
        }

        // PUT: api/chat/conversaciones/{id}/cerrar
        [HttpPut("conversaciones/{id}/cerrar")]
        public async Task<ActionResult> CerrarConversacion(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var conversacion = await _context.ChatConversaciones.FindAsync(id);
            if (conversacion == null)
                return NotFound();

            // Verificar permisos
            if (user.Role != "admin" && user.Role != "soporte" && conversacion.UsuarioId != userId)
                return Forbid();

            conversacion.Estado = "Cerrada";
            conversacion.FechaCierre = DateTime.Now;

            await _context.SaveChangesAsync();

            await LogActivity("Cerrar conversación de chat", $"Conversación #{id} cerrada");

            return Ok();
        }

        // GET: api/chat/conversaciones/{id}/activos-usuario
        [HttpGet("conversaciones/{id}/activos-usuario")]
        public async Task<ActionResult<object>> GetActivosUsuario(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var conversacion = await _context.ChatConversaciones
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversacion == null)
                return NotFound();

            // Verificar permisos
            if (user.Role != "admin" && user.Role != "soporte" && conversacion.UsuarioId != userId)
                return Forbid();

            // Obtener datos del usuario desde la nómina
            var usuarioEmail = conversacion.Usuario != null ? conversacion.Usuario.Username : null;
            var nominaUsuario = await _context.NominaUsuarios
                .FirstOrDefaultAsync(n => n.Email == usuarioEmail);

            if (nominaUsuario == null)
                return NotFound("Usuario no encontrado en la nómina");

            // Obtener activos asignados al usuario
            var activosAsignados = await _context.AsignacionesActivos
                .Include(aa => aa.Activo)
                .Where(aa => aa.UsuarioId == nominaUsuario.Id && aa.Estado == "Activa")
                .Select(aa => new
                {
                    aa.Activo.Id,
                    aa.Activo.Codigo,
                    aa.Activo.Categoria,
                    aa.Activo.Estado,
                    aa.Activo.Ubicacion,
                    aa.Activo.NombreEquipo,
                    aa.Activo.TipoEquipo,
                    aa.Activo.Procesador,
                    aa.Activo.SistemaOperativo,
                    aa.Activo.Serie,
                    aa.Activo.Ram,
                    aa.Activo.Marca,
                    aa.Activo.Modelo,
                    aa.Activo.DiscosJson,
                    aa.Activo.Pulgadas,
                    aa.Activo.Imei,
                    aa.Activo.Capacidad,
                    aa.Activo.Nombre,
                    aa.Activo.Cantidad,
                    FechaAsignacion = aa.FechaAsignacion
                })
                .ToListAsync();

            return Ok(new
            {
                usuario = new
                {
                    nominaUsuario.Id,
                    nominaUsuario.Nombre,
                    nominaUsuario.Apellido,
                    nominaUsuario.Email,
                    nominaUsuario.Departamento,
                    nominaUsuario.Empresa
                },
                activosAsignados
            });
        }

        // POST: api/chat/conversaciones/{id}/generar-ticket
        [HttpPost("conversaciones/{id}/generar-ticket")]
        public async Task<ActionResult<object>> GenerarTicket(int id, [FromBody] GenerarTicketRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            var conversacion = await _context.ChatConversaciones
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversacion == null)
                return NotFound();

            // Verificar permisos
            if (user.Role != "admin" && user.Role != "soporte" && conversacion.UsuarioId != userId)
                return Forbid();

            // Obtener datos del usuario desde la nómina
            var usuarioEmail = conversacion.Usuario != null ? conversacion.Usuario.Username : null;
            var nominaUsuario = await _context.NominaUsuarios
                .FirstOrDefaultAsync(n => n.Email == usuarioEmail);

            // Crear el ticket
            var ticket = new Ticket
            {
                Titulo = request.Titulo,
                Descripcion = request.Descripcion,
                NombreSolicitante = nominaUsuario != null 
                    ? $"{nominaUsuario.Nombre} {nominaUsuario.Apellido}"
                    : conversacion.Usuario?.Username ?? "Usuario",
                EmailSolicitante = nominaUsuario?.Email ?? conversacion.Usuario?.Username ?? "usuario@empresa.com",
                Empresa = request.Empresa,
                Departamento = request.Departamento,
                Categoria = request.Categoria,
                Prioridad = request.Prioridad,
                Estado = "Pendiente",
                CreadoPorId = userId.Value,
                ActivoId = request.ActivoId // Agregar el activo seleccionado
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            // Vincular el ticket a la conversación
            conversacion.TicketId = ticket.Id;
            await _context.SaveChangesAsync();

            await LogActivity("Generar ticket desde chat", $"Ticket #{ticket.Id} generado desde conversación #{id}");

            return Ok(new
            {
                ticket.Id,
                ticket.Titulo,
                ticket.Estado,
                ticket.FechaCreacion
            });
        }

        // Métodos auxiliares
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }

        private async Task LogActivity(string action, string description, object? details = null)
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                var log = new UserActivityLog
                {
                    UserId = userId.Value,
                    Action = action,
                    Description = description,
                    Details = details?.ToString(),
                    Timestamp = DateTime.Now
                };

                _context.UserActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }
        }
    }

    // DTOs
    public class CrearConversacionRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? MensajeInicial { get; set; }
        public int? SoporteId { get; set; }
    }

    public class EnviarMensajeRequest
    {
        public string Contenido { get; set; } = string.Empty;
        public bool EsInterno { get; set; } = false;
    }

    public class AsignarSoporteRequest
    {
        public int SoporteId { get; set; }
    }

    public class GenerarTicketRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Empresa { get; set; } = string.Empty;
        public string? Departamento { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Prioridad { get; set; } = string.Empty;
        public int? ActivoId { get; set; } // ID del activo seleccionado (opcional)
    }
}
