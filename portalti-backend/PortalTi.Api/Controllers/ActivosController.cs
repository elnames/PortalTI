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
    [Authorize]
    public class ActivosController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<ActivosController> _logger;

        public ActivosController(PortalTiContext db, ILogger<ActivosController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            try
            {
                var activos = await _db.Activos
                    .Include(a => a.Asignaciones)
                    .ThenInclude(aa => aa.Usuario)
                    .ToListAsync();

                var result = activos.Select(a => new
                {
                    a.Id,
                    a.Codigo,
                    a.Categoria,
                    a.Estado,
                    a.Ubicacion,
                    a.Empresa,
                    a.NombreEquipo,
                    a.TipoEquipo,
                    a.Procesador,
                    a.SistemaOperativo,
                    a.Serie,
                    a.Ram,
                    a.Marca,
                    a.Modelo,
                    a.DiscosJson,
                    a.Pulgadas,
                    a.Imei,
                    a.Capacidad,
                    a.Nombre,
                    a.Cantidad,
                    AsignadoA = a.Asignaciones
                        .Where(aa => aa.Estado == "Activa")
                        .Select(aa => new
                        {
                            asignacionId = aa.Id,
                            aa.Usuario.Id,
                            aa.Usuario.Nombre,
                            aa.Usuario.Apellido,
                            aa.Usuario.Email,
                            aa.Usuario.Departamento,
                            aa.FechaAsignacion,
                            aa.Estado
                        })
                        .FirstOrDefault()
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener activos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("mis-activos")]
        public async Task<ActionResult<IEnumerable<object>>> GetMisActivos()
        {
            try
            {
                // Obtener el ID del usuario desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim?.Value;
                if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int id))
                    return Unauthorized("Usuario no autenticado.");

                // Buscar el usuario en la nómina
                var userEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
                var userEmail = userEmailClaim?.Value;
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Usuario no autenticado.");

                var usuario = await _db.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Email == userEmail);

                if (usuario == null)
                    return NotFound("Usuario no encontrado en la nómina.");

                // Obtener activos asignados al usuario
                var activos = await _db.Activos
                    .Include(a => a.Asignaciones)
                    .ThenInclude(aa => aa.Usuario)
                    .Where(a => a.Asignaciones.Any(aa => aa.UsuarioId == usuario.Id && aa.Estado == "Activa"))
                    .ToListAsync();

                var result = activos.Select(a => new
                {
                    a.Id,
                    a.Codigo,
                    a.Categoria,
                    a.Estado,
                    a.Ubicacion,
                    a.Empresa,
                    a.NombreEquipo,
                    a.TipoEquipo,
                    a.Procesador,
                    a.SistemaOperativo,
                    a.Serie,
                    a.Ram,
                    a.Marca,
                    a.Modelo,
                    a.DiscosJson,
                    a.Pulgadas,
                    a.Imei,
                    a.Capacidad,
                    a.Nombre,
                    a.Cantidad,
                    FechaAsignacion = a.Asignaciones
                        .Where(aa => aa.UsuarioId == usuario.Id && aa.Estado == "Activa")
                        .Select(aa => aa.FechaAsignacion)
                        .FirstOrDefault()
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener mis activos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("{codigo}")]
        public async Task<ActionResult<object>> Get(string codigo)
        {
            try
            {
                var activo = await _db.Activos
                    .Include(a => a.Asignaciones)
                    .ThenInclude(aa => aa.Usuario)
                    .FirstOrDefaultAsync(a => a.Codigo == codigo);

                if (activo == null)
                    return NotFound("Activo no encontrado");

                var result = new
                {
                    activo.Id,
                    activo.Codigo,
                    activo.Categoria,
                    activo.Estado,
                    activo.Ubicacion,
                    activo.Empresa,
                    activo.NombreEquipo,
                    activo.TipoEquipo,
                    activo.Procesador,
                    activo.SistemaOperativo,
                    activo.Serie,
                    activo.Ram,
                    activo.Marca,
                    activo.Modelo,
                    activo.DiscosJson,
                    activo.Pulgadas,
                    activo.Imei,
                    activo.Capacidad,
                    activo.Nombre,
                    activo.Cantidad,
                    AsignadoA = activo.Asignaciones
                        .Where(aa => aa.Estado == "Activa")
                        .Select(aa => new
                        {
                            asignacionId = aa.Id,
                            aa.Usuario.Id,
                            aa.Usuario.Nombre,
                            aa.Usuario.Apellido,
                            aa.Usuario.Email,
                            aa.Usuario.Departamento,
                            aa.FechaAsignacion,
                            aa.Estado
                        })
                        .FirstOrDefault()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener activo {Codigo}", codigo);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPost]
        [AuditAction("crear_activo", "Activo", true, true)]
        public async Task<ActionResult<Activo>> Create(Activo activo)
        {
            try
            {
                // Debug logging para monitores
                if (activo.Categoria?.ToLower() == "monitores")
                {
                    _logger.LogInformation("Creando monitor - Marca: {Marca}, Modelo: {Modelo}, Serie: {Serie}, Pulgadas: {Pulgadas}", 
                        activo.Marca, activo.Modelo, activo.Serie, activo.Pulgadas);
                }

                // Verificar si el código ya existe
                if (await _db.Activos.AnyAsync(a => a.Codigo == activo.Codigo))
                {
                    return BadRequest("El código ya está registrado");
                }

                _db.Activos.Add(activo);
                await _db.SaveChangesAsync();

                // Notificar nuevo activo registrado
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    // Notificar a admins sobre nuevo activo
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "asset",
                        Titulo = "Nuevo activo registrado",
                        Mensaje = $"Se ha registrado un nuevo activo: {activo.Codigo} - {activo.Categoria}",
                        RefTipo = "Activo",
                        RefId = activo.Id,
                        Ruta = $"/activos/{activo.Id}"
                    });
                    
                    // Notificar también a soporte
                    await notificationService.CreateForRoleAsync("soporte", new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "asset",
                        Titulo = "Nuevo activo registrado",
                        Mensaje = $"Se ha registrado un nuevo activo: {activo.Codigo} - {activo.Categoria}",
                        RefTipo = "Activo",
                        RefId = activo.Id,
                        Ruta = $"/activos/{activo.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando nuevo activo: {ex.Message}");
                }

                // Log de actividad
                await LogActivity("create_asset", $"Activo creado: {activo.Codigo} - {activo.Categoria}", new { 
                    activoId = activo.Id,
                    codigo = activo.Codigo,
                    categoria = activo.Categoria,
                    estado = activo.Estado,
                    ubicacion = activo.Ubicacion,
                    empresa = activo.Empresa,
                    nombreEquipo = activo.NombreEquipo,
                    tipoEquipo = activo.TipoEquipo,
                    marca = activo.Marca,
                    modelo = activo.Modelo,
                    serie = activo.Serie,
                    pulgadas = activo.Pulgadas
                });

                return CreatedAtAction(nameof(Get), new { codigo = activo.Codigo }, activo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear activo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPut("{codigo}")]
        [AuditAction("actualizar_activo", "Activo", true, true)]
        public async Task<IActionResult> Update(string codigo, Activo activo)
        {
            try
            {
                var existingAsset = await _db.Activos.FirstOrDefaultAsync(a => a.Codigo == codigo);
                if (existingAsset == null)
                    return NotFound("Activo no encontrado");

                // Verificar si el código ya existe (excluyendo el activo actual)
                if (await _db.Activos.AnyAsync(a => a.Codigo == activo.Codigo && a.Codigo != codigo))
                {
                    return BadRequest("El código ya está registrado");
                }

                // Guardar datos originales para el log
                var originalData = new
                {
                    codigo = existingAsset.Codigo,
                    categoria = existingAsset.Categoria,
                    estado = existingAsset.Estado,
                    ubicacion = existingAsset.Ubicacion,
                    nombreEquipo = existingAsset.NombreEquipo,
                    tipoEquipo = existingAsset.TipoEquipo
                };

                // Actualizar campos
                existingAsset.Codigo = activo.Codigo;
                existingAsset.Categoria = activo.Categoria;
                existingAsset.Estado = activo.Estado;
                existingAsset.Ubicacion = activo.Ubicacion;
                existingAsset.NombreEquipo = activo.NombreEquipo;
                existingAsset.TipoEquipo = activo.TipoEquipo;
                existingAsset.Procesador = activo.Procesador;
                existingAsset.Serie = activo.Serie;
                existingAsset.Ram = activo.Ram;
                existingAsset.Marca = activo.Marca;
                existingAsset.Modelo = activo.Modelo;
                existingAsset.DiscosJson = activo.DiscosJson;
                existingAsset.Pulgadas = activo.Pulgadas;
                existingAsset.Imei = activo.Imei;
                existingAsset.Capacidad = activo.Capacidad;
                existingAsset.Nombre = activo.Nombre;
                existingAsset.Cantidad = activo.Cantidad;
                existingAsset.Empresa = activo.Empresa;

                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity("update_asset", $"Activo actualizado: {activo.Codigo} - {activo.Categoria}", new { 
                    activoId = existingAsset.Id,
                    originalData,
                    newData = new {
                        codigo = activo.Codigo,
                        categoria = activo.Categoria,
                        estado = activo.Estado,
                        ubicacion = activo.Ubicacion,
                        nombreEquipo = activo.NombreEquipo,
                        tipoEquipo = activo.TipoEquipo
                    }
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar activo {Codigo}", codigo);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("{codigo}")]
        public async Task<IActionResult> Delete(string codigo)
        {
            try
            {
                var activo = await _db.Activos.FirstOrDefaultAsync(a => a.Codigo == codigo);
                if (activo == null)
                    return NotFound("Activo no encontrado");

                // Eliminar asignaciones relacionadas primero
                var asignaciones = await _db.AsignacionesActivos
                    .Where(a => a.ActivoId == activo.Id)
                    .ToListAsync();
                
                _db.AsignacionesActivos.RemoveRange(asignaciones);

                var assetData = new { codigo = activo.Codigo, categoria = activo.Categoria };

                _db.Activos.Remove(activo);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity("delete_asset", $"Activo eliminado: {activo.Codigo} - {activo.Categoria}", new { 
                    activoId = activo.Id,
                    assetData
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar activo {Codigo}", codigo);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("multiple")]
        public async Task<IActionResult> DeleteMultiple([FromBody] List<string> codigos)
        {
            try
            {
                if (codigos == null || !codigos.Any())
                    return BadRequest("No se proporcionaron códigos para eliminar");

                var activos = await _db.Activos
                    .Where(a => codigos.Contains(a.Codigo))
                    .ToListAsync();

                if (!activos.Any())
                    return NotFound("No se encontraron activos para eliminar");

                var activosIds = activos.Select(a => a.Id).ToList();

                // Eliminar asignaciones relacionadas primero
                var asignaciones = await _db.AsignacionesActivos
                    .Where(a => activosIds.Contains(a.ActivoId))
                    .ToListAsync();
                
                _db.AsignacionesActivos.RemoveRange(asignaciones);

                var assetData = activos.Select(a => new { codigo = a.Codigo, categoria = a.Categoria }).ToList();

                _db.Activos.RemoveRange(activos);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity("delete_multiple_assets", $"Se eliminaron {activos.Count} activos", new { 
                    activoIds = activosIds,
                    assetData
                });

                return Ok(new { message = $"Se eliminaron {activos.Count} activos exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar múltiples activos");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        private async Task LogActivity(string action, string description, object? details = null)
        {
            try
            {
                // Obtener el ID del usuario actual desde el token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userIdClaimValue = userIdClaim?.Value;
                if (int.TryParse(userIdClaimValue, out int currentUserId))
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

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? int.Parse(userIdClaim) : null;
        }

        private string GetClientIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
            var remoteIp = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            
            return forwardedFor ?? realIp ?? remoteIp ?? "Unknown";
        }

        [HttpGet("usuarios/{email}/activos")]
        public async Task<ActionResult<IEnumerable<object>>> GetActivosPorUsuario(string email)
        {
            try
            {
                _logger.LogInformation("Buscando activos para usuario con email: {Email}", email);
                
                // Buscar el usuario en la nómina por email
                var usuario = await _db.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (usuario == null)
                {
                    _logger.LogWarning("Usuario no encontrado para email: {Email}", email);
                    return NotFound("Usuario no encontrado.");
                }

                _logger.LogInformation("Usuario encontrado: {UsuarioId}", usuario.Id);

                // Obtener activos asignados al usuario
                var activosAsignados = await _db.AsignacionesActivos
                    .Include(aa => aa.Activo)
                    .Where(aa => aa.UsuarioId == usuario.Id && aa.Estado == "Activa")
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
                        aa.Activo.RustDeskId,
                        aa.Activo.RustDeskPassword,
                        aa.Activo.AnyDeskId,
                        aa.Activo.AnyDeskPassword,
                        FechaAsignacion = aa.FechaAsignacion
                    })
                    .ToListAsync();

                _logger.LogInformation("Encontrados {Count} activos para usuario {Email}", activosAsignados.Count, email);

                return Ok(activosAsignados);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener activos del usuario {Email}", email);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPut("{id}/dar-baja")]
        public async Task<ActionResult<object>> DarBaja(int id, [FromBody] DarBajaActivoRequest request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _db.AuthUsers.FindAsync(userId);
            if (user == null)
                return NotFound();

            // Solo admin y soporte pueden dar de baja activos
            if (user.Role != "admin" && user.Role != "soporte")
                return Forbid();

            var activo = await _db.Activos
                .Include(a => a.Asignaciones)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (activo == null)
                return NotFound();

            // Verificar que el activo no esté asignado
            if (activo.Asignaciones.Any(a => a.Estado == "Activa"))
                return BadRequest("No se puede dar de baja un activo que está asignado");

            activo.Estado = "Dado de Baja";
            activo.FechaBaja = DateTime.Now;
            activo.MotivoBaja = request.MotivoBaja;

            await _db.SaveChangesAsync();

            await LogActivity("Dar de baja activo", $"Activo #{id} dado de baja", new { Motivo = request.MotivoBaja });

            return Ok(new
            {
                activo.Id,
                activo.Codigo,
                activo.Estado,
                activo.FechaBaja,
                activo.MotivoBaja
            });
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> UpdateEstado(int id, [FromBody] UpdateEstadoActivoDto dto)
        {
            try
            {
                var activo = await _db.Activos.FindAsync(id);
                if (activo == null)
                    return NotFound("Activo no encontrado.");

                // Validar que el estado sea válido
                var estadosValidos = new[] { "Operativo", "En Mantenimiento", "Retirado", "Defectuoso" };
                if (!estadosValidos.Contains(dto.Estado))
                    return BadRequest("Estado no válido. Estados permitidos: Operativo, En Mantenimiento, Retirado, Defectuoso");

                activo.Estado = dto.Estado;
                await _db.SaveChangesAsync();

                await LogActivity("UpdateEstado", $"Estado del activo {activo.Codigo} actualizado a {dto.Estado}", new { ActivoId = id, EstadoAnterior = activo.Estado, EstadoNuevo = dto.Estado });

                return Ok(new { message = $"Estado del activo actualizado a {dto.Estado}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar estado del activo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PATCH: api/Activos/{id}/rustdesk-id
        [HttpPatch("{id}/rustdesk-id")]
        public async Task<IActionResult> UpdateRustDeskId(int id, [FromBody] UpdateRustDeskIdDto dto)
        {
            try
            {
                var activo = await _db.Activos.FindAsync(id);
                if (activo == null)
                {
                    return NotFound();
                }

                activo.RustDeskId = dto.RustDeskId;
                await _db.SaveChangesAsync();

                await LogActivity("UpdateRustDeskId", $"ID de RustDesk del activo {activo.Codigo} actualizado", new { ActivoId = id, RustDeskId = dto.RustDeskId });

                return Ok(new { message = "ID de RustDesk actualizado correctamente", rustDeskId = activo.RustDeskId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar ID de RustDesk");
                return StatusCode(500, new { message = "Error al actualizar ID de RustDesk", error = ex.Message });
            }
        }

        // PATCH: api/Activos/{id}/rustdesk-password
        [HttpPatch("{id}/rustdesk-password")]
        public async Task<IActionResult> UpdateRustDeskPassword(int id, [FromBody] UpdatePasswordDto dto)
        {
            try
            {
                var activo = await _db.Activos.FindAsync(id);
                if (activo == null)
                {
                    return NotFound();
                }

                activo.RustDeskPassword = dto.Password;
                await _db.SaveChangesAsync();

                await LogActivity("UpdateRustDeskPassword", $"Contraseña de RustDesk del activo {activo.Codigo} actualizada", new { ActivoId = id });

                return Ok(new { message = "Contraseña de RustDesk actualizada correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar contraseña de RustDesk");
                return StatusCode(500, new { message = "Error al actualizar contraseña de RustDesk", error = ex.Message });
            }
        }

        // PATCH: api/Activos/{id}/anydesk-id
        [HttpPatch("{id}/anydesk-id")]
        public async Task<IActionResult> UpdateAnyDeskId(int id, [FromBody] UpdateAnyDeskIdDto dto)
        {
            try
            {
                var activo = await _db.Activos.FindAsync(id);
                if (activo == null)
                {
                    return NotFound();
                }

                activo.AnyDeskId = dto.AnyDeskId;
                await _db.SaveChangesAsync();

                await LogActivity("UpdateAnyDeskId", $"ID de AnyDesk del activo {activo.Codigo} actualizado", new { ActivoId = id, AnyDeskId = dto.AnyDeskId });

                return Ok(new { message = "ID de AnyDesk actualizado correctamente", anyDeskId = activo.AnyDeskId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar ID de AnyDesk");
                return StatusCode(500, new { message = "Error al actualizar ID de AnyDesk", error = ex.Message });
            }
        }

        // PATCH: api/Activos/{id}/anydesk-password
        [HttpPatch("{id}/anydesk-password")]
        public async Task<IActionResult> UpdateAnyDeskPassword(int id, [FromBody] UpdatePasswordDto dto)
        {
            try
            {
                var activo = await _db.Activos.FindAsync(id);
                if (activo == null)
                {
                    return NotFound();
                }

                activo.AnyDeskPassword = dto.Password;
                await _db.SaveChangesAsync();

                await LogActivity("UpdateAnyDeskPassword", $"Contraseña de AnyDesk del activo {activo.Codigo} actualizada", new { ActivoId = id });

                return Ok(new { message = "Contraseña de AnyDesk actualizada correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar contraseña de AnyDesk");
                return StatusCode(500, new { message = "Error al actualizar contraseña de AnyDesk", error = ex.Message });
            }
        }
    }

    public class DarBajaActivoRequest
    {
        public string MotivoBaja { get; set; } = string.Empty;
    }

    public class UpdateRustDeskIdDto
    {
        public string RustDeskId { get; set; } = string.Empty;
    }

    public class UpdateAnyDeskIdDto
    {
        public string AnyDeskId { get; set; } = string.Empty;
    }

    public class UpdatePasswordDto
    {
        public string Password { get; set; } = string.Empty;
    }
}
