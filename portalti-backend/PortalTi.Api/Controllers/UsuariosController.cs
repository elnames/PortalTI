using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;
using System.Text.Json;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<UsuariosController> _logger;

        public UsuariosController(PortalTiContext db, ILogger<UsuariosController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            try
            {
                var usuarios = await _db.NominaUsuarios
                    .Include(u => u.Asignaciones)
                    .ThenInclude(a => a.Activo)
                    .ToListAsync();

                var result = usuarios.Select(u => new
                {
                    u.Id,
                    u.Nombre,
                    u.Apellido,
                    u.Email,
                    u.Rut,
                    u.Departamento,
                    u.Empresa,
                    u.Ubicacion,
                    ActivosAsignados = u.Asignaciones
                        .Where(a => a.Estado == "Activa")
                        .Select(a => new
                        {
                            asignacionId = a.Id, // ID de la asignación
                            a.Activo.Id,
                            a.Activo.Codigo,
                            a.Activo.Categoria,
                            a.Activo.Estado,
                            a.Activo.Ubicacion,
                            a.Activo.NombreEquipo,
                            a.Activo.TipoEquipo,
                            a.Activo.Marca,
                            a.Activo.Modelo,
                            a.FechaAsignacion
                        }).ToList()
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> Get(int id)
        {
            try
            {
                var usuario = await _db.NominaUsuarios
                    .Include(u => u.Asignaciones)
                    .ThenInclude(a => a.Activo)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (usuario == null)
                    return NotFound("Usuario no encontrado");

                var result = new
                {
                    usuario.Id,
                    usuario.Nombre,
                    usuario.Apellido,
                    usuario.Email,
                    usuario.Rut,
                    usuario.Departamento,
                    usuario.Empresa,
                    usuario.Ubicacion,
                    ActivosAsignados = usuario.Asignaciones
                        .Where(a => a.Estado == "Activa")
                        .Select(a => new
                        {
                            asignacionId = a.Id, // ID de la asignación
                            a.Activo.Id,
                            a.Activo.Codigo,
                            a.Activo.Categoria,
                            a.Activo.Estado,
                            a.Activo.Ubicacion,
                            a.Activo.NombreEquipo,
                            a.Activo.TipoEquipo,
                            a.Activo.Marca,
                            a.Activo.Modelo,
                            a.FechaAsignacion
                        }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost]
        [AuditAction("crear_usuario_nomina", "NominaUsuario", true, true)]
        public async Task<ActionResult<NominaUsuario>> Create(NominaUsuario usuario)
        {
            try
            {
                // Verificar si el RUT ya existe
                if (await _db.NominaUsuarios.AnyAsync(u => u.Rut == usuario.Rut))
                {
                    return BadRequest("El RUT ya está registrado");
                }

                // Verificar si el email ya existe
                if (await _db.NominaUsuarios.AnyAsync(u => u.Email == usuario.Email))
                {
                    return BadRequest("El email ya está registrado");
                }

                _db.NominaUsuarios.Add(usuario);
                await _db.SaveChangesAsync();

                // Notificar a admins y soporte sobre nuevo usuario creado
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    // Notificar a admins y soporte
                    await notificationService.CreateForRoleAsync("admin", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "user",
                        Titulo = "Nuevo usuario creado",
                        Mensaje = $"Se ha creado un nuevo usuario: {usuario.Nombre} {usuario.Apellido} ({usuario.Email})",
                        RefTipo = "Usuario",
                        RefId = usuario.Id,
                        Ruta = $"/usuarios/{usuario.Id}"
                    });
                    
                    await notificationService.CreateForRoleAsync("soporte", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "user",
                        Titulo = "Nuevo usuario creado",
                        Mensaje = $"Se ha creado un nuevo usuario: {usuario.Nombre} {usuario.Apellido} ({usuario.Email})",
                        RefTipo = "Usuario",
                        RefId = usuario.Id,
                        Ruta = $"/usuarios/{usuario.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando nuevo usuario: {ex.Message}");
                }

                // Log de actividad
                await LogActivity("create_user", $"Usuario creado: {usuario.Nombre} {usuario.Apellido}", new { 
                    userId = usuario.Id,
                    nombre = usuario.Nombre,
                    apellido = usuario.Apellido,
                    email = usuario.Email,
                    rut = usuario.Rut,
                    departamento = usuario.Departamento,
                    ubicacion = usuario.Ubicacion
                });

                return CreatedAtAction(nameof(Get), new { id = usuario.Id }, usuario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPut("{id}")]
        [AuditAction("actualizar_usuario_nomina", "NominaUsuario", true, true)]
        public async Task<IActionResult> Update(int id, NominaUsuario usuario)
        {
            try
            {
                _logger.LogInformation("PUT /usuarios/{Id} - Datos recibidos: Nombre={Nombre}, Apellido={Apellido}, Email={Email}, Rut={Rut}, Departamento={Departamento}, Empresa={Empresa}, Ubicacion={Ubicacion}", 
                    id, usuario.Nombre, usuario.Apellido, usuario.Email, usuario.Rut, usuario.Departamento, usuario.Empresa, usuario.Ubicacion);

                var existingUser = await _db.NominaUsuarios.FindAsync(id);
                if (existingUser == null)
                {
                    _logger.LogWarning("Usuario no encontrado con ID: {Id}", id);
                    return NotFound("Usuario no encontrado");
                }

                _logger.LogInformation("Usuario encontrado: {Nombre} {Apellido}", existingUser.Nombre, existingUser.Apellido);

                // Verificar si el RUT ya existe (excluyendo el usuario actual)
                if (await _db.NominaUsuarios.AnyAsync(u => u.Rut == usuario.Rut && u.Id != id))
                {
                    _logger.LogWarning("RUT duplicado: {Rut}", usuario.Rut);
                    return BadRequest("El RUT ya está registrado");
                }

                // Verificar si el email ya existe (excluyendo el usuario actual) SOLO si el email cambió
                if (!string.Equals(existingUser.Email, usuario.Email, StringComparison.OrdinalIgnoreCase))
                {
                    var existingEmail = await _db.NominaUsuarios
                        .Where(u => u.Email == usuario.Email && u.Id != id)
                        .FirstOrDefaultAsync();
                    
                    if (existingEmail != null)
                    {
                        _logger.LogWarning("Email duplicado: {Email} - Usuario existente: {ExistingUserId} ({ExistingName})", 
                            usuario.Email, existingEmail.Id, $"{existingEmail.Nombre} {existingEmail.Apellido}");
                        return BadRequest("El email ya está registrado");
                    }
                    _logger.LogInformation("Email válido: {Email}", usuario.Email);
                }

                // Guardar datos originales para el log
                var originalData = new
                {
                    nombre = existingUser.Nombre,
                    apellido = existingUser.Apellido,
                    email = existingUser.Email,
                    rut = existingUser.Rut,
                    departamento = existingUser.Departamento,
                    empresa = existingUser.Empresa,
                    ubicacion = existingUser.Ubicacion
                };

                // Actualizar campos
                existingUser.Nombre = usuario.Nombre;
                existingUser.Apellido = usuario.Apellido;
                existingUser.Email = usuario.Email;
                existingUser.Rut = usuario.Rut;
                existingUser.Departamento = usuario.Departamento;
                existingUser.Empresa = usuario.Empresa;
                existingUser.Ubicacion = usuario.Ubicacion;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Usuario actualizado exitosamente: {Nombre} {Apellido}", usuario.Nombre, usuario.Apellido);

                // Log de actividad
                await LogActivity("update_user", $"Usuario actualizado: {usuario.Nombre} {usuario.Apellido}", new { 
                    userId = id,
                    originalData,
                    newData = new {
                        nombre = usuario.Nombre,
                        apellido = usuario.Apellido,
                        email = usuario.Email,
                        rut = usuario.Rut,
                        departamento = usuario.Departamento,
                        empresa = usuario.Empresa
                    }
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var usuario = await _db.NominaUsuarios
                    .Include(u => u.Asignaciones)
                    .ThenInclude(a => a.Activo)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (usuario == null)
                    return NotFound("Usuario no encontrado");

                // Obtener asignaciones activas
                var asignacionesActivas = usuario.Asignaciones
                    .Where(a => a.Estado == "Activa")
                    .ToList();

                var activosDesasignados = asignacionesActivas.Select(a => new
                {
                    activoId = a.ActivoId,
                    codigo = a.Activo.Codigo,
                    categoria = a.Activo.Categoria,
                    nombreEquipo = a.Activo.NombreEquipo
                }).ToList();

                // Marcar asignaciones activas como devueltas automáticamente
                foreach (var asignacion in asignacionesActivas)
                {
                    asignacion.Estado = "Devuelta";
                    asignacion.FechaDevolucion = DateTime.Now;
                    asignacion.Observaciones = $"Usuario eliminado automáticamente: {usuario.Nombre} {usuario.Apellido}";
                }

                var userData = new { nombre = usuario.Nombre, apellido = usuario.Apellido };

                _db.NominaUsuarios.Remove(usuario);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity("delete_user", $"Usuario eliminado: {usuario.Nombre} {usuario.Apellido}", new { 
                    userId = id,
                    userData,
                    activosDesasignados = activosDesasignados.Count,
                    activosDetalles = activosDesasignados
                });

                return Ok(new { 
                    message = $"Usuario {usuario.Nombre} {usuario.Apellido} eliminado exitosamente",
                    activosDesasignados = activosDesasignados.Count,
                    activosDetalles = activosDesasignados
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("multiple")]
        public async Task<IActionResult> DeleteMultiple([FromBody] List<int> ids)
        {
            try
            {
                if (ids == null || !ids.Any())
                    return BadRequest("No se proporcionaron IDs para eliminar");

                var usuarios = await _db.NominaUsuarios
                    .Include(u => u.Asignaciones)
                    .ThenInclude(a => a.Activo)
                    .Where(u => ids.Contains(u.Id))
                    .ToListAsync();

                if (!usuarios.Any())
                    return NotFound("No se encontraron usuarios para eliminar");

                var usuariosIds = usuarios.Select(u => u.Id).ToList();
                var resumenEliminacion = new List<object>();

                // Procesar cada usuario y sus asignaciones
                foreach (var usuario in usuarios)
                {
                    var asignacionesActivas = usuario.Asignaciones
                        .Where(a => a.Estado == "Activa")
                        .ToList();

                    var activosDesasignados = asignacionesActivas.Select(a => new
                    {
                        activoId = a.ActivoId,
                        codigo = a.Activo.Codigo,
                        categoria = a.Activo.Categoria,
                        nombreEquipo = a.Activo.NombreEquipo
                    }).ToList();

                    // Marcar asignaciones activas como devueltas automáticamente
                    foreach (var asignacion in asignacionesActivas)
                    {
                        asignacion.Estado = "Devuelta";
                        asignacion.FechaDevolucion = DateTime.Now;
                        asignacion.Observaciones = $"Usuario eliminado automáticamente: {usuario.Nombre} {usuario.Apellido}";
                    }

                    resumenEliminacion.Add(new
                    {
                        usuarioId = usuario.Id,
                        nombre = $"{usuario.Nombre} {usuario.Apellido}",
                        activosDesasignados = activosDesasignados.Count,
                        activosDetalles = activosDesasignados
                    });
                }

                var userData = usuarios.Select(u => new { nombre = u.Nombre, apellido = u.Apellido }).ToList();

                _db.NominaUsuarios.RemoveRange(usuarios);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity("delete_multiple_users", $"Se eliminaron {usuarios.Count} usuarios", new { 
                    userIds = usuariosIds,
                    userData,
                    resumenEliminacion
                });

                var totalActivosDesasignados = resumenEliminacion.Sum(r => {
                    var property = r.GetType().GetProperty("activosDesasignados");
                    var value = property?.GetValue(r);
                    return value != null ? (int)value : 0;
                });

                return Ok(new { 
                    message = $"Se eliminaron {usuarios.Count} usuarios exitosamente",
                    usuariosEliminados = usuarios.Count,
                    totalActivosDesasignados,
                    resumenEliminacion
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar múltiples usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // Endpoint temporal para actualizar usuarios sin empresa
        [HttpPost("update-empresa-default")]
        public async Task<IActionResult> UpdateEmpresaDefault()
        {
            try
            {
                var usuariosSinEmpresa = await _db.NominaUsuarios
                    .Where(u => string.IsNullOrEmpty(u.Empresa) || u.Empresa.Trim() == "")
                    .ToListAsync();

                _logger.LogInformation($"Encontrados {usuariosSinEmpresa.Count} usuarios sin empresa asignada");

                foreach (var usuario in usuariosSinEmpresa)
                {
                    usuario.Empresa = "Empresa A";
                    _logger.LogInformation($"Actualizando usuario {usuario.Id} ({usuario.Nombre} {usuario.Apellido}) con empresa: Empresa A");
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation($"Se actualizaron {usuariosSinEmpresa.Count} usuarios exitosamente");

                return Ok(new { 
                    message = $"Se actualizaron {usuariosSinEmpresa.Count} usuarios exitosamente",
                    updatedCount = usuariosSinEmpresa.Count 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar usuarios sin empresa");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        private async Task LogActivity(string action, string description, object? details = null)
        {
            try
            {
                // Obtener el ID del usuario actual desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out int currentUserId))
                {
                    var log = new UserActivityLog
                    {
                        UserId = currentUserId,
                        Action = action,
                        Description = description,
                        Details = details != null ? JsonSerializer.Serialize(details) : null,
                        Timestamp = DateTime.Now,
                        IpAddress = GetClientIpAddress(),
                        UserAgent = Request.Headers["User-Agent"].ToString()
                    };

                    _db.UserActivityLogs.Add(log);
                    await _db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar actividad");
            }
        }

        private string GetClientIpAddress()
        {
            // Intentar obtener la IP real del cliente, considerando proxies y load balancers
            var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                           Request.Headers["X-Real-IP"].FirstOrDefault() ??
                           Request.Headers["CF-Connecting-IP"].FirstOrDefault() ??
                           Request.Headers["X-Client-IP"].FirstOrDefault() ??
                           Request.Headers["X-Originating-IP"].FirstOrDefault() ??
                           Request.Headers["X-Remote-IP"].FirstOrDefault() ??
                           Request.Headers["X-Remote-Addr"].FirstOrDefault() ??
                           Request.HttpContext.Connection.RemoteIpAddress?.ToString();

            // Si hay múltiples IPs en X-Forwarded-For, tomar la primera (la del cliente original)
            if (!string.IsNullOrEmpty(ipAddress) && ipAddress.Contains(","))
            {
                ipAddress = ipAddress.Split(',')[0].Trim();
            }

            // Validar que sea una IP válida
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1" || ipAddress == "127.0.0.1")
            {
                ipAddress = "Local";
            }

            return ipAddress ?? "Unknown";
        }
    }
}
