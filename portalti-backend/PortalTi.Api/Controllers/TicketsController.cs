using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using PortalTi.Api.Hubs;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly PortalTiContext _context;
        private readonly ILogger<TicketsController> _logger;
        private readonly IHubContext<NotificationsHub> _hubContext;
        private readonly IConfiguration _configuration;

        public TicketsController(PortalTiContext context, ILogger<TicketsController> logger, IHubContext<NotificationsHub> hubContext, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
            _configuration = configuration;
        }

        private async Task<int?> ResolveAuthUserIdByEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email)) return null;
            var normalized = email.Trim().ToLower();
            var user = await _context.AuthUsers
                .FirstOrDefaultAsync(u => u.Username.ToLower() == normalized && u.IsActive);
            return user?.Id;
        }

        // GET: api/tickets - Obtener tickets según el rol del usuario
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetTickets(
            [FromQuery] string? estado = null,
            [FromQuery] string? prioridad = null,
            [FromQuery] string? categoria = null,
            [FromQuery] int? asignadoAId = null)
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");

            IQueryable<Ticket> query = _context.Tickets
                .Include(t => t.AsignadoA)
                .Include(t => t.CreadoPor)
                .Include(t => t.Comentarios.OrderByDescending(c => c.FechaCreacion).Take(1))
                .Include(t => t.Archivos)
                .AsQueryable();

            // Filtrar según el rol
            if (userRole?.ToLower() == "soporte")
            {
                // Soporte puede ver todos los tickets
                // No aplicar filtro adicional
            }
            else if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            // Aplicar filtros adicionales
            if (!string.IsNullOrEmpty(estado))
                query = query.Where(t => t.Estado == estado);
            
            if (!string.IsNullOrEmpty(prioridad))
                query = query.Where(t => t.Prioridad == prioridad);
            
            if (!string.IsNullOrEmpty(categoria))
                query = query.Where(t => t.Categoria == categoria);
            
            if (asignadoAId.HasValue)
                query = query.Where(t => t.AsignadoAId == asignadoAId);

            var tickets = await query
                .OrderByDescending(t => t.FechaCreacion)
                .Select(t => new
                {
                    t.Id,
                    t.Titulo,
                    t.Descripcion,
                    t.NombreSolicitante,
                    t.EmailSolicitante,
                    t.TelefonoSolicitante,
                    t.Empresa,
                    t.Departamento,
                    t.Categoria,
                    t.Prioridad,
                    t.Estado,
                    t.FechaCreacion,
                    t.FechaAsignacion,
                    t.FechaResolucion,
                    t.FechaCierre,
                    AsignadoA = t.AsignadoA != null ? new
                    {
                        t.AsignadoA.Id,
                        t.AsignadoA.Username
                    } : null,
                    CreadoPor = t.CreadoPor != null ? new
                    {
                        t.CreadoPor.Id,
                        t.CreadoPor.Username
                    } : null,
                    UltimoComentario = t.Comentarios.FirstOrDefault() != null ? new
                    {
                        t.Comentarios.First().Contenido,
                        t.Comentarios.First().FechaCreacion
                    } : null,
                    CantidadComentarios = t.Comentarios.Count,
                    CantidadArchivos = t.Archivos.Count
                })
                .ToListAsync();

            return Ok(tickets);
        }

        // GET: api/tickets/{id} - Obtener ticket específico
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetTicket(int id)
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");

            var ticket = await _context.Tickets
                .Include(t => t.AsignadoA)
                .Include(t => t.CreadoPor)
                .Include(t => t.Activo)
                .Include(t => t.Comentarios.OrderBy(c => c.FechaCreacion))
                .Include(t => t.Archivos.OrderBy(a => a.FechaSubida))
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null)
                return NotFound();

            // Verificar permisos según el rol
            switch (userRole?.ToLower())
            {
                case "admin":
                    // Admin puede ver todos los tickets
                    break;
                case "soporte":
                    // Soporte puede ver tickets asignados a él o pendientes
                    if (ticket.AsignadoAId != userId && ticket.Estado != "Pendiente")
                        return Forbid();
                    break;
                case "usuario":
                    // Usuario solo puede ver tickets donde su email coincida con el EmailSolicitante
                    var userEmailClaim = User.FindFirst(ClaimTypes.Name);
                    var userEmail = userEmailClaim?.Value;
                    if (string.IsNullOrEmpty(userEmail) || ticket.EmailSolicitante != userEmail)
                        return Forbid();
                    break;
                default:
                    return Forbid();
            }

            var result = new
            {
                ticket.Id,
                ticket.Titulo,
                ticket.Descripcion,
                ticket.NombreSolicitante,
                ticket.EmailSolicitante,
                ticket.TelefonoSolicitante,
                ticket.Empresa,
                ticket.Departamento,
                ticket.Categoria,
                ticket.Prioridad,
                ticket.Estado,
                ticket.FechaCreacion,
                ticket.FechaAsignacion,
                ticket.FechaResolucion,
                ticket.FechaCierre,
                AsignadoA = ticket.AsignadoA != null ? new
                {
                    ticket.AsignadoA.Id,
                    ticket.AsignadoA.Username
                } : null,
                CreadoPor = ticket.CreadoPor != null ? new
                {
                    ticket.CreadoPor.Id,
                    ticket.CreadoPor.Username
                } : null,
                Activo = ticket.Activo != null ? new
                {
                    ticket.Activo.Id,
                    ticket.Activo.Codigo,
                    ticket.Activo.Categoria,
                    ticket.Activo.Estado,
                    ticket.Activo.NombreEquipo,
                    ticket.Activo.TipoEquipo,
                    ticket.Activo.Marca,
                    ticket.Activo.Modelo
                } : null,
                Comentarios = ticket.Comentarios.Select(c => new
                {
                    c.Id,
                    c.Contenido,
                    c.FechaCreacion,
                    c.EsInterno,
                    c.Evidencia,
                    CreadoPor = c.CreadoPor != null ? new
                    {
                        c.CreadoPor.Id,
                        c.CreadoPor.Username
                    } : null
                }),
                Archivos = ticket.Archivos.Select(a => new
                {
                    a.Id,
                    a.NombreOriginal,
                    a.TamañoBytes,
                    a.TipoMime,
                    a.FechaSubida,
                    SubidoPor = a.SubidoPor != null ? new
                    {
                        a.SubidoPor.Id,
                        a.SubidoPor.Username
                    } : null
                })
            };

            return Ok(result);
        }

        // POST: api/tickets - Crear nuevo ticket (público)
        [HttpPost]
        [AllowAnonymous]
        [AuditAction("crear_ticket", "Ticket", true, true)]
        public async Task<ActionResult<object>> CreateTicket([FromBody] CreateTicketDto ticketDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ticket = new Ticket
            {
                Titulo = ticketDto.Titulo,
                Descripcion = ticketDto.Descripcion,
                NombreSolicitante = ticketDto.NombreSolicitante,
                EmailSolicitante = ticketDto.EmailSolicitante,
                TelefonoSolicitante = ticketDto.TelefonoSolicitante,
                Empresa = ticketDto.Empresa,
                Departamento = ticketDto.Departamento,
                Categoria = ticketDto.Categoria,
                Prioridad = ticketDto.Prioridad,
                ActivoId = ticketDto.ActivoId,
                Estado = "Pendiente",
                FechaCreacion = DateTime.Now
            };

            // Intentar asociar el AuthUser creador si existe por email
            try
            {
                var creador = await _context.AuthUsers.FirstOrDefaultAsync(u => u.Username == ticketDto.EmailSolicitante && u.IsActive);
                if (creador != null)
                {
                    ticket.CreadoPorId = creador.Id;
                }
            }
            catch { }

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            // Notificar a los admins sobre el nuevo ticket
            try
            {
                var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                {
                    UserId = 0, // Se asignará a todos los admins
                    Tipo = "ticket",
                    Titulo = "Nuevo ticket creado",
                    Mensaje = $"Se ha creado un nuevo ticket: {ticket.Titulo} por {ticket.NombreSolicitante}",
                    RefTipo = "Ticket",
                    RefId = ticket.Id,
                    Ruta = $"/tickets/{ticket.Id}"
                });
            }
            catch (Exception ex)
            {
                // Log del error pero no fallar la creación del ticket
                Console.WriteLine($"Error notificando a admins: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, new
            {
                ticket.Id,
                ticket.Titulo,
                ticket.Estado,
                ticket.FechaCreacion,
                Mensaje = "Ticket creado exitosamente. Se le notificará cuando sea asignado."
            });
        }

        // PUT: api/tickets/{id}/asignar - Asignar ticket a soporte o autoasignar
        [HttpPut("{id}/asignar")]
        [Authorize(Policy = "CanAssignTickets")]
        [AuditAction("asignar_ticket", "Ticket", true, true)]
        public async Task<IActionResult> AsignarTicket(int id, [FromBody] AsignarTicketDto asignacionDto)
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value?.ToLower();
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound();

            // Guardar el asignado anterior para crear comentario de reasignación
            var asignadoAnterior = ticket.AsignadoAId;
            var asignadoAnteriorNombre = "";
            if (asignadoAnterior.HasValue)
            {
                var usuarioAnterior = await _context.AuthUsers.FindAsync(asignadoAnterior.Value);
                asignadoAnteriorNombre = usuarioAnterior?.Username ?? "Usuario anterior";
            }

            // Si SoporteId es null o 0, desasignar ticket (solo admin)
            if ((asignacionDto.SoporteId == 0 || asignacionDto.SoporteId == null) && userRole == "admin")
            {
                ticket.AsignadoAId = null;
                ticket.Estado = "Pendiente";
                ticket.FechaAsignacion = null;
                await _context.SaveChangesAsync();
                return Ok(new { Mensaje = "Ticket desasignado exitosamente" });
            }

            // Permitir autoasignación por soporte
            if (userRole == "soporte" && asignacionDto.SoporteId == userId)
            {
                ticket.AsignadoAId = userId;
                ticket.Estado = "Asignado";
                ticket.FechaAsignacion = DateTime.Now;
                await _context.SaveChangesAsync();
                
                // Crear comentario de autoasignación
                var comentarioAutoasignacion = new ComentarioTicket
                {
                    TicketId = ticket.Id,
                    Contenido = $"Ticket autoasignado por {User.FindFirst(ClaimTypes.Name)?.Value}",
                    EsInterno = false,
                    CreadoPorId = userId,
                    FechaCreacion = DateTime.Now
                };
                _context.ComentariosTickets.Add(comentarioAutoasignacion);
                await _context.SaveChangesAsync();
                
                // Notificar al soporte (opcional, ya es el mismo usuario)
                await NotificarAsignacionSoporte(ticket, userId);

                // Notificar al creador del ticket (o mapeo por email)
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    int? creadorId = ticket.CreadoPorId ?? await ResolveAuthUserIdByEmail(ticket.EmailSolicitante);
                    if (creadorId.HasValue)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = creadorId.Value,
                            Tipo = "ticket",
                            Titulo = "Tu ticket fue asignado",
                            Mensaje = $"Tu ticket #{ticket.Id} fue asignado a soporte",
                            RefTipo = "Ticket",
                            RefId = ticket.Id,
                            Ruta = "/mis-tickets"
                        });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando asignación a creador: {ex.Message}");
                }
                return Ok(new { Mensaje = "Ticket autoasignado exitosamente" });
            }

            // Solo admin puede asignar a otros
            if (userRole == "admin")
            {
                var soporte = await _context.AuthUsers
                    .FirstOrDefaultAsync(u => u.Id == asignacionDto.SoporteId && u.Role.ToLower() == "soporte");
                if (soporte == null)
                    return BadRequest("Usuario de soporte no encontrado");
                
                ticket.AsignadoAId = asignacionDto.SoporteId;
                // No cambiar el estado si ya está en "En Proceso" o posterior
                if (ticket.Estado == "Pendiente") {
                    ticket.Estado = "Asignado";
                }
                ticket.FechaAsignacion = DateTime.Now;
                await _context.SaveChangesAsync();
                
                // Crear comentario de asignación/reasignación
                if (asignadoAnterior.HasValue && asignadoAnterior.Value != asignacionDto.SoporteId)
                {
                    // Reasignación
                    var comentarioReasignacion = new ComentarioTicket
                    {
                        TicketId = ticket.Id,
                        Contenido = $"Ticket reasignado de {asignadoAnteriorNombre} a {soporte.Username}",
                        EsInterno = false,
                        CreadoPorId = userId,
                        FechaCreacion = DateTime.Now
                    };
                    _context.ComentariosTickets.Add(comentarioReasignacion);
                    await _context.SaveChangesAsync();
                }
                else if (!asignadoAnterior.HasValue)
                {
                    // Primera asignación
                    var comentarioAsignacion = new ComentarioTicket
                    {
                        TicketId = ticket.Id,
                        Contenido = $"Ticket asignado a {soporte.Username}",
                        EsInterno = false,
                        CreadoPorId = userId,
                        FechaCreacion = DateTime.Now
                    };
                    _context.ComentariosTickets.Add(comentarioAsignacion);
                    await _context.SaveChangesAsync();
                }
                
                // Notificar al soporte asignado
                await NotificarAsignacionSoporte(ticket, soporte.Id);

                // Notificar al creador del ticket (o mapeo por email) que ya está asignado
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    int? creadorId = ticket.CreadoPorId ?? await ResolveAuthUserIdByEmail(ticket.EmailSolicitante);
                    if (creadorId.HasValue)
                    {
                        await notificationService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = creadorId.Value,
                            Tipo = "ticket",
                            Titulo = "Tu ticket fue asignado",
                            Mensaje = $"Tu ticket #{ticket.Id} fue asignado a {soporte.Username}",
                            RefTipo = "Ticket",
                            RefId = ticket.Id,
                            Ruta = "/mis-tickets"
                        });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando asignación a creador: {ex.Message}");
                }
                return Ok(new { Mensaje = "Ticket asignado exitosamente" });
            }

            return Forbid();
        }

        // Notificar asignación a soporte usando el servicio central (persiste + SignalR)
        private async Task NotificarAsignacionSoporte(Ticket ticket, int soporteId)
        {
            try
            {
                var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                await notificationService.CreateAsync(new CreateNotificationDto
                {
                    UserId = soporteId,
                    Tipo = "ticket",
                    Titulo = "Ticket asignado",
                    Mensaje = $"Se te ha asignado el ticket #{ticket.Id}: {ticket.Titulo}",
                    RefTipo = "Ticket",
                    RefId = ticket.Id,
                    Ruta = $"/tickets/{ticket.Id}"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error notificando asignación a soporte {soporteId}: {ex.Message}");
            }
        }

        // PUT: api/tickets/{id}/estado - Cambiar estado del ticket
        [HttpPut("{id}/estado")]
        [Authorize(Policy = "CanManageTickets")]
        [AuditAction("cambiar_estado_ticket", "Ticket", true, true)]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto estadoDto)
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");

            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound();

            // Verificar permisos
            if (userRole?.ToLower() == "soporte" && ticket.AsignadoAId != userId)
                return Forbid();

            ticket.Estado = estadoDto.Estado;

            // Actualizar fechas según el estado
            switch (estadoDto.Estado)
            {
                case "En Proceso":
                    if (ticket.FechaAsignacion == null)
                        ticket.FechaAsignacion = DateTime.Now;
                    break;
                case "Resuelto":
                    ticket.FechaResolucion = DateTime.Now;
                    break;
                case "Cerrado":
                    ticket.FechaCierre = DateTime.Now;
                    break;
            }

            await _context.SaveChangesAsync();

            // Notificar cambio de estado
            try
            {
                var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                
                // Notificar al creador del ticket (con fallback a email)
                int? creadorId = ticket.CreadoPorId ?? await ResolveAuthUserIdByEmail(ticket.EmailSolicitante);
                if (creadorId.HasValue && creadorId != userId)
                {
                    await notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = creadorId.Value,
                        Tipo = "ticket",
                        Titulo = "Estado de tu ticket actualizado",
                        Mensaje = $"Tu ticket #{ticket.Id}: {ticket.Titulo} cambió a '{estadoDto.Estado}'",
                        RefTipo = "Ticket",
                        RefId = ticket.Id,
                        Ruta = "/mis-tickets"
                    });
                }
                
                // Notificar al soporte asignado si no es quien ejecuta el cambio
                if (ticket.AsignadoAId.HasValue && ticket.AsignadoAId.Value != userId)
                {
                    await notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = ticket.AsignadoAId.Value,
                        Tipo = "ticket",
                        Titulo = "Ticket actualizado",
                        Mensaje = $"El ticket #{ticket.Id}: {ticket.Titulo} cambió a '{estadoDto.Estado}'",
                        RefTipo = "Ticket",
                        RefId = ticket.Id,
                        Ruta = $"/tickets/{ticket.Id}"
                    });
                }
                
                // Notificar a admins si se resuelve o cierra
                if ((estadoDto.Estado == "Resuelto" || estadoDto.Estado == "Cerrado") && 
                    userRole?.ToLower() != "admin")
                {
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "ticket",
                        Titulo = "Ticket resuelto/cerrado",
                        Mensaje = $"El ticket #{ticket.Id}: {ticket.Titulo} fue {estadoDto.Estado.ToLower()} por {User.FindFirst(ClaimTypes.Name)?.Value}",
                        RefTipo = "Ticket",
                        RefId = ticket.Id,
                        Ruta = $"/tickets/{ticket.Id}"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error notificando cambio de estado: {ex.Message}");
            }

            return Ok(new { Mensaje = "Estado actualizado exitosamente" });
        }

        // GET: api/tickets/{id}/comentarios - Obtener comentarios del ticket
        [HttpGet("{id}/comentarios")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetComentarios(int id)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Comentarios.OrderBy(c => c.FechaCreacion))
                .ThenInclude(c => c.CreadoPor)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null)
                return NotFound();

            var comentarios = ticket.Comentarios
                .Where(c => !c.EsMensajeChat) // Excluir mensajes de chat
                .Select(c => new
                {
                    c.Id,
                    c.Contenido,
                    c.FechaCreacion,
                    c.EsInterno,
                    c.Evidencia,
                    c.EstadoCreacion,
                    CreadoPor = c.CreadoPor != null ? new
                    {
                        c.CreadoPor.Id,
                        c.CreadoPor.Username
                    } : null
                });

            return Ok(comentarios);
        }

        // POST: api/tickets/{id}/comentarios - Agregar comentario (solo para actualizaciones del timeline)
        [HttpPost("{id}/comentarios")]
        [Authorize(Policy = "CanManageTickets")]
        [AuditAction("agregar_comentario_ticket", "ComentarioTicket", true, true)]
        public async Task<ActionResult<object>> AgregarComentario(int id, [FromBody] AgregarComentarioDto comentarioDto)
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");

            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound();

            // Verificar permisos para actualizaciones del timeline
            // Los soportes solo pueden enviar actualizaciones a tickets asignados a ellos
            if (userRole?.ToLower() == "soporte" && ticket.AsignadoAId != userId)
                return Forbid();

            var comentario = new ComentarioTicket
            {
                TicketId = id,
                Contenido = comentarioDto.Contenido,
                EsInterno = comentarioDto.EsInterno,
                Evidencia = comentarioDto.Evidencia,
                EstadoCreacion = comentarioDto.EsInterno ? null : ticket.Estado, // Solo guardar estado si NO es interno
                CreadoPorId = userId,
                FechaCreacion = DateTime.Now
            };

            _context.ComentariosTickets.Add(comentario);
            await _context.SaveChangesAsync();

            // Notificar nuevo comentario
            try
            {
                var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                
                // Notificar al creador del ticket si no es quien comentó
                if (ticket.CreadoPorId.HasValue && ticket.CreadoPorId != userId)
                {
                    await notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = ticket.CreadoPorId.Value,
                        Tipo = "ticket",
                        Titulo = "Nuevo comentario en ticket",
                        Mensaje = $"Se agregó un comentario al ticket #{ticket.Id}: {ticket.Titulo}",
                        RefTipo = "Ticket",
                        RefId = ticket.Id,
                        Ruta = $"/tickets/{ticket.Id}"
                    });
                }
                
                // Notificar al técnico asignado si no es quien comentó
                if (ticket.AsignadoAId.HasValue && ticket.AsignadoAId != userId)
                {
                    await notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = ticket.AsignadoAId.Value,
                        Tipo = "ticket",
                        Titulo = "Nuevo comentario en ticket",
                        Mensaje = $"Se agregó un comentario al ticket #{ticket.Id}: {ticket.Titulo}",
                        RefTipo = "Ticket",
                        RefId = ticket.Id,
                        Ruta = $"/tickets/{ticket.Id}"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error notificando comentario: {ex.Message}");
            }

            return Ok(new
            {
                comentario.Id,
                comentario.Contenido,
                comentario.FechaCreacion,
                comentario.EsInterno,
                comentario.Evidencia,
                CreadoPor = new
                {
                    Id = userId,
                    Username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Usuario"
                }
            });
        }

        // POST: api/tickets/{id}/mensajes - Agregar mensaje de chat
        [HttpPost("{id}/mensajes")]
        [Authorize]
        [AuditAction("agregar_mensaje_ticket", "ComentarioTicket", true, true)]
        public async Task<ActionResult<object>> AgregarMensaje(int id, [FromBody] AgregarMensajeDto mensajeDto)
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");

            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound();

            // Verificar permisos para mensajes de chat
            // Los usuarios solo pueden enviar mensajes no internos
            if (userRole?.ToLower() == "usuario" && mensajeDto.EsInterno)
                return Forbid();

            // Los soportes solo pueden enviar mensajes internos a tickets asignados a ellos
            // Los admin pueden enviar mensajes internos sin restricciones
            if (userRole?.ToLower() == "soporte" && mensajeDto.EsInterno && ticket.AsignadoAId != userId)
                return Forbid();

            var mensaje = new ComentarioTicket
            {
                TicketId = id,
                Contenido = mensajeDto.Contenido,
                EsInterno = mensajeDto.EsInterno,
                EsMensajeChat = true, // Marcar como mensaje de chat
                CreadoPorId = userId,
                FechaCreacion = DateTime.Now
            };

            _context.ComentariosTickets.Add(mensaje);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje.Id,
                mensaje.Contenido,
                mensaje.FechaCreacion,
                mensaje.EsInterno,
                CreadoPor = new
                {
                    Id = userId,
                    Username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Usuario"
                }
            });
        }

        // GET: api/tickets/{id}/mensajes - Obtener mensajes de chat
        [HttpGet("{id}/mensajes")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetMensajes(int id)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Comentarios.OrderBy(c => c.FechaCreacion))
                .ThenInclude(c => c.CreadoPor)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null)
                return NotFound();

            var mensajes = ticket.Comentarios
                .Where(c => c.EsMensajeChat) // Solo mensajes de chat
                .Select(c => new
                {
                    c.Id,
                    c.Contenido,
                    c.FechaCreacion,
                    c.EsInterno,
                    CreadoPor = c.CreadoPor != null ? new
                    {
                        c.CreadoPor.Id,
                        c.CreadoPor.Username
                    } : null
                });

            return Ok(mensajes);
        }

        // DELETE: api/tickets/{id}/comentarios/{comentarioId} - Eliminar comentario
        [HttpDelete("{id}/comentarios/{comentarioId}")]
        [Authorize(Policy = "CanManageTickets")]
        [AuditAction("eliminar_comentario_ticket", "ComentarioTicket", true, true)]
        public async Task<IActionResult> EliminarComentario(int id, int comentarioId)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null)
                return NotFound();

            var comentario = await _context.ComentariosTickets.FindAsync(comentarioId);
            if (comentario == null || comentario.TicketId != id)
                return NotFound();

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;

            // Verificar permisos: solo el creador del comentario o admin puede eliminarlo
            if (comentario.CreadoPorId != userId && userRole?.ToLower() != "admin")
                return Forbid();

            _context.ComentariosTickets.Remove(comentario);
            await _context.SaveChangesAsync();

            return Ok(new { Mensaje = "Comentario eliminado exitosamente" });
        }

        // POST: api/tickets/upload-evidence - Subir evidencia para comentarios
        [HttpPost("upload-evidence")]
        [Authorize(Policy = "CanManageTickets")]
        [AuditAction("subir_evidencia_ticket", "ArchivoTicket", true, true)]
        public async Task<ActionResult<object>> UploadEvidence(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No se proporcionó ningún archivo" });

            // Validar tipo de archivo
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new { message = "Solo se permiten archivos de imagen (JPG, PNG, GIF)" });

            // Validar tamaño (máximo 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "El archivo es demasiado grande. Máximo 5MB" });

            try
            {
                // Generar nombre único para el archivo en almacenamiento privado
                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var storageRoot = _configuration["Storage:Root"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Storage");
                var uploadPath = Path.Combine(storageRoot, "evidence");

                Directory.CreateDirectory(uploadPath);
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // URL segura para previsualización autenticada
                var previewUrl = $"/api/securefile/preview/evidence/{fileName}";

                return Ok(new { url = previewUrl, message = "Archivo subido exitosamente" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error al subir el archivo" });
            }
        }

        // GET: api/tickets/estadisticas - Obtener estadísticas
        [HttpGet("estadisticas")]
        [Authorize(Policy = "CanViewReports")]
        [AuditAction("ver_estadisticas_tickets", "Ticket", false, false)]
        public async Task<ActionResult<object>> GetEstadisticas()
        {
            var estadisticas = await _context.Tickets
                .GroupBy(t => t.Estado)
                .Select(g => new
                {
                    Estado = g.Key,
                    Cantidad = g.Count()
                })
                .ToListAsync();

            var ticketsPorPrioridad = await _context.Tickets
                .GroupBy(t => t.Prioridad)
                .Select(g => new
                {
                    Prioridad = g.Key,
                    Cantidad = g.Count()
                })
                .ToListAsync();

            var ticketsPorCategoria = await _context.Tickets
                .GroupBy(t => t.Categoria)
                .Select(g => new
                {
                    Categoria = g.Key,
                    Cantidad = g.Count()
                })
                .ToListAsync();

            var ticketsRecientes = await _context.Tickets
                .Where(t => t.FechaCreacion >= DateTime.Now.AddDays(-7))
                .CountAsync();

            return Ok(new
            {
                PorEstado = estadisticas,
                PorPrioridad = ticketsPorPrioridad,
                PorCategoria = ticketsPorCategoria,
                TicketsRecientes = ticketsRecientes,
                TotalTickets = await _context.Tickets.CountAsync()
            });
        }

        // GET: api/tickets/soporte/usuarios - Obtener usuarios de soporte
        [HttpGet("soporte/usuarios")]
        [Authorize(Policy = "CanManageTickets")]
        [AuditAction("ver_usuarios_soporte", "AuthUser", false, false)]
        public async Task<ActionResult<IEnumerable<object>>> GetUsuariosSoporte()
        {
            var usuariosSoporte = await _context.AuthUsers
                .Where(u => u.Role.ToLower() == "soporte" && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Username
                })
                .ToListAsync();

            return Ok(usuariosSoporte);
        }

        // GET: api/tickets/mis-tickets - Obtener tickets activos asignados al usuario de soporte actual
        [HttpGet("mis-tickets")]
        [Authorize(Policy = "CanAssignTickets")]
        [AuditAction("ver_mis_tickets", "Ticket", false, false)]
        public async Task<ActionResult<object>> GetMisTickets(
            [FromQuery] string? estado = null,
            [FromQuery] string? prioridad = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                IQueryable<Ticket> query = _context.Tickets
                    .Include(t => t.AsignadoA)
                    .Include(t => t.CreadoPor)
                    .Where(t => t.AsignadoAId == userId && (t.Estado == "Pendiente" || t.Estado == "Asignado" || t.Estado == "En Proceso"));

                // Aplicar filtros
                if (!string.IsNullOrEmpty(estado))
                    query = query.Where(t => t.Estado == estado);
                
                if (!string.IsNullOrEmpty(prioridad))
                    query = query.Where(t => t.Prioridad == prioridad);

                var totalTickets = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalTickets / pageSize);

                var tickets = await query
                    .OrderByDescending(t => t.FechaCreacion)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titulo,
                        t.Descripcion,
                        t.NombreSolicitante,
                        t.EmailSolicitante,
                        t.TelefonoSolicitante,
                        t.Empresa,
                        t.Departamento,
                        t.Categoria,
                        t.Prioridad,
                        t.Estado,
                        t.FechaCreacion,
                        t.FechaAsignacion,
                        t.FechaResolucion,
                        t.FechaCierre,
                        AsignadoA = t.AsignadoA != null ? new
                        {
                            t.AsignadoA.Id,
                            t.AsignadoA.Username
                        } : null,
                        CreadoPor = t.CreadoPor != null ? new
                        {
                            t.CreadoPor.Id,
                            t.CreadoPor.Username
                        } : null,
                        CantidadComentarios = t.Comentarios.Count,
                        CantidadArchivos = t.Archivos.Count
                    })
                    .ToListAsync();

                return Ok(new
                {
                    tickets,
                    pagination = new
                    {
                        currentPage = page,
                        totalPages,
                        totalTickets,
                        pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
            }
        }

        // GET: api/tickets/mis-tickets-historial - Obtener historial de tickets del soporte
        [HttpGet("mis-tickets-historial")]
        [Authorize(Policy = "CanAssignTickets")]
        [AuditAction("ver_historial_tickets", "Ticket", false, false)]
        public async Task<ActionResult<object>> GetMisTicketsHistorial(
            [FromQuery] string? estado = null,
            [FromQuery] string? prioridad = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                IQueryable<Ticket> query = _context.Tickets
                    .Include(t => t.AsignadoA)
                    .Include(t => t.CreadoPor)
                    .Where(t => t.AsignadoAId == userId && (t.Estado == "Resuelto" || t.Estado == "Cerrado"));

                // Aplicar filtros
                if (!string.IsNullOrEmpty(estado))
                    query = query.Where(t => t.Estado == estado);
                
                if (!string.IsNullOrEmpty(prioridad))
                    query = query.Where(t => t.Prioridad == prioridad);

                var totalTickets = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalTickets / pageSize);

                var tickets = await query
                    .OrderByDescending(t => t.FechaCreacion)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titulo,
                        t.Descripcion,
                        t.NombreSolicitante,
                        t.EmailSolicitante,
                        t.TelefonoSolicitante,
                        t.Empresa,
                        t.Departamento,
                        t.Categoria,
                        t.Prioridad,
                        t.Estado,
                        t.FechaCreacion,
                        t.FechaAsignacion,
                        t.FechaResolucion,
                        t.FechaCierre,
                        AsignadoA = t.AsignadoA != null ? new
                        {
                            t.AsignadoA.Id,
                            t.AsignadoA.Username
                        } : null,
                        CreadoPor = t.CreadoPor != null ? new
                        {
                            t.CreadoPor.Id,
                            t.CreadoPor.Username
                        } : null,
                        CantidadComentarios = t.Comentarios.Count,
                        CantidadArchivos = t.Archivos.Count
                    })
                    .ToListAsync();

                return Ok(new
                {
                    tickets,
                    pagination = new
                    {
                        currentPage = page,
                        totalPages,
                        totalTickets,
                        pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
            }
        }

        // GET: api/tickets/mis-tickets-usuario - Obtener tickets creados por el usuario actual
        [HttpGet("mis-tickets-usuario")]
        [Authorize]
        [AuditAction("ver_mis_tickets_usuario", "Ticket", false, false)]
        public async Task<ActionResult<IEnumerable<object>>> GetMisTicketsUsuario(
            [FromQuery] string? estado = null,
            [FromQuery] string? prioridad = null)
        {
            try
            {
                var userRoleClaim = User.FindFirst(ClaimTypes.Role);
                var userRole = userRoleClaim?.Value;
                var userEmailClaim = User.FindFirst(ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;

                // Verificar que el usuario tenga un rol válido
                if (string.IsNullOrEmpty(userRole))
                {
                    return Unauthorized("Rol de usuario no encontrado en el token");
                }

                // Verificar que el usuario tenga un email válido
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized("Email de usuario no encontrado en el token");
                }

                IQueryable<Ticket> query = _context.Tickets
                    .Include(t => t.AsignadoA)
                    .Include(t => t.CreadoPor)
                    .Include(t => t.Comentarios.OrderByDescending(c => c.FechaCreacion).Take(1))
                    .Where(t => t.EmailSolicitante == userEmail)
                    .AsQueryable();

                // Aplicar filtros adicionales
                if (!string.IsNullOrEmpty(estado))
                    query = query.Where(t => t.Estado == estado);
                
                if (!string.IsNullOrEmpty(prioridad))
                    query = query.Where(t => t.Prioridad == prioridad);

                var tickets = await query
                    .OrderByDescending(t => t.FechaCreacion)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titulo,
                        t.Descripcion,
                        t.NombreSolicitante,
                        t.EmailSolicitante,
                        t.TelefonoSolicitante,
                        t.Empresa,
                        t.Departamento,
                        t.Categoria,
                        t.Prioridad,
                        t.Estado,
                        t.FechaCreacion,
                        t.FechaAsignacion,
                        t.FechaResolucion,
                        t.FechaCierre,
                        AsignadoA = t.AsignadoA != null ? new
                        {
                            t.AsignadoA.Id,
                            t.AsignadoA.Username
                        } : null,
                        CreadoPor = t.CreadoPor != null ? new
                        {
                            t.CreadoPor.Id,
                            t.CreadoPor.Username
                        } : null,
                        UltimoComentario = t.Comentarios.FirstOrDefault() != null ? new
                        {
                            t.Comentarios.First().Contenido,
                            t.Comentarios.First().FechaCreacion
                        } : null,
                        CantidadComentarios = t.Comentarios.Count,
                        CantidadArchivos = t.Archivos.Count
                    })
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
            }
        }

        // GET: api/tickets/health - Health check para verificar disponibilidad
        [HttpGet("health")]
        [AllowAnonymous]
        public ActionResult<object> HealthCheck()
        {
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                service = "Tickets API"
            });
        }

        // GET: api/tickets/usuario/{email} - Obtener tickets de un usuario específico
        [HttpGet("usuario/{email}")]
        [Authorize(Policy = "CanManageTickets")]
        [AuditAction("ver_tickets_usuario_email", "Ticket", false, false)]
        public async Task<ActionResult<IEnumerable<object>>> GetTicketsUsuario(string email)
        {
            try
            {
                var tickets = await _context.Tickets
                    .Where(t => t.EmailSolicitante == email)
                    .OrderByDescending(t => t.FechaCreacion)
                    .Select(t => new
                    {
                        t.Id,
                        t.Titulo,
                        t.Descripcion,
                        t.Categoria,
                        t.Prioridad,
                        t.Estado,
                        t.FechaCreacion,
                        t.FechaAsignacion,
                        t.FechaResolucion,
                        t.FechaCierre,
                        AsignadoA = t.AsignadoA != null ? new
                        {
                            t.AsignadoA.Id,
                            t.AsignadoA.Username
                        } : null
                    })
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al obtener tickets del usuario", details = ex.Message });
            }
        }

        // GET: api/tickets/health-user - Health check para usuarios autenticados
        [HttpGet("health-user")]
        [Authorize]
        public ActionResult<object> HealthCheckUser()
        {
            var userRoleClaim = User.FindFirst(ClaimTypes.Role);
            var userRole = userRoleClaim?.Value;
            var userEmailClaim = User.FindFirst(ClaimTypes.Name);
            var userEmail = userEmailClaim?.Value;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var userId = userIdClaim?.Value;
            
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                service = "Tickets API",
                userRole = userRole,
                userEmail = userEmail,
                userId = userId
            });
        }
    }

    // DTOs
    public class CreateTicketDto
    {
        public string Titulo { get; set; }
        public string Descripcion { get; set; }
        public string NombreSolicitante { get; set; }
        public string EmailSolicitante { get; set; }
        public string? TelefonoSolicitante { get; set; }
        public string Empresa { get; set; }
        public string? Departamento { get; set; }
        public string Categoria { get; set; }
        public string Prioridad { get; set; }
        public int? ActivoId { get; set; }
    }

    public class AsignarTicketDto
    {
        public int? SoporteId { get; set; }
    }

    public class CambiarEstadoDto
    {
        public string Estado { get; set; }
    }

    public class AgregarComentarioDto
    {
        public string Contenido { get; set; }
        public bool EsInterno { get; set; } = false;
        public string? Evidencia { get; set; } // URL de la imagen
    }

    public class AgregarMensajeDto
    {
        public string Contenido { get; set; }
        public bool EsInterno { get; set; } = false;
    }
} 