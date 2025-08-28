using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using System.Text.Json;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class SystemConfigController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<SystemConfigController> _logger;
        private readonly ISystemConfigurationService _configService;

        public SystemConfigController(
            PortalTiContext db, 
            ILogger<SystemConfigController> logger, 
            ISystemConfigurationService configService)
        {
            _db = db;
            _logger = logger;
            _configService = configService;
        }

        // GET: api/systemconfig
        [HttpGet]
        public async Task<IActionResult> GetSystemConfig()
        {
            try
            {
                var config = await _configService.GetConfigurationAsync();
                return Ok(config);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener configuración del sistema");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/systemconfig
        [HttpPut]
        public async Task<IActionResult> UpdateSystemConfig([FromBody] UpdateSystemConfigRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("Usuario no autenticado");
                }

                var success = true;

                // Actualizar configuración de apariencia
                if (request.Appearance != null)
                {
                    success &= await _configService.UpdateConfigurationAsync("Appearance", request.Appearance, userId.Value);
                }

                // Actualizar configuración de notificaciones
                if (request.Notifications != null)
                {
                    success &= await _configService.UpdateConfigurationAsync("Notifications", request.Notifications, userId.Value);
                }

                // Actualizar configuración de seguridad
                if (request.Security != null)
                {
                    success &= await _configService.UpdateConfigurationAsync("Security", request.Security, userId.Value);
                }

                // Actualizar configuración de backup
                if (request.Backup != null)
                {
                    success &= await _configService.UpdateConfigurationAsync("Backup", request.Backup, userId.Value);
                }

                // Actualizar configuración del sistema
                if (request.System != null)
                {
                    success &= await _configService.UpdateConfigurationAsync("System", request.System, userId.Value);
                }

                if (success)
                {
                    await LogActivity(userId.Value, "update_system_config", "Configuración del sistema actualizada", request);
                    return Ok(new { message = "Configuración actualizada correctamente" });
                }
                else
                {
                    return StatusCode(500, "Error al actualizar algunas configuraciones");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar configuración del sistema");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/systemconfig/backup
        [HttpPost("backup")]
        public async Task<IActionResult> CreateBackup()
        {
            try
            {
                var backupPath = await _configService.GetValueAsync("Backup", "BackupPath", "./backups");
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var fileName = $"backup_{timestamp}.sql";

                // Crear directorio de backup si no existe
                Directory.CreateDirectory(backupPath);
                var fullPath = Path.Combine(backupPath, fileName);

                // Aquí implementarías la lógica real de backup
                // Por ahora, creamos un archivo de ejemplo
                await System.IO.File.WriteAllTextAsync(fullPath, "-- Backup del sistema generado el " + DateTime.Now);

                var userId = GetCurrentUserId();
                if (userId.HasValue)
                {
                    await LogActivity(userId.Value, "create_backup", $"Backup creado: {fileName}");
                }

                return Ok(new { message = "Backup creado correctamente", fileName, path = fullPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear backup");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/systemconfig/maintenance
        [HttpPost("maintenance")]
        public async Task<IActionResult> ToggleMaintenanceMode([FromBody] MaintenanceModeRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized("Usuario no autenticado");
                }

                // Actualizar modo mantenimiento
                var success = await _configService.SetValueAsync("System", "MaintenanceMode", request.Enabled.ToString(), userId.Value);
                
                if (request.Enabled && !string.IsNullOrEmpty(request.Message))
                {
                    success &= await _configService.SetValueAsync("System", "MaintenanceMessage", request.Message, userId.Value);
                }

                if (success)
                {
                    var action = request.Enabled ? "activado" : "desactivado";
                    await LogActivity(userId.Value, "toggle_maintenance", $"Modo mantenimiento {action}");
                    
                    return Ok(new { 
                        message = $"Modo mantenimiento {action} correctamente",
                        maintenanceMode = request.Enabled
                    });
                }
                else
                {
                    return StatusCode(500, "Error al cambiar modo mantenimiento");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar modo mantenimiento");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/systemconfig/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            try
            {
                var stats = new
                {
                    Users = new
                    {
                        Total = await _db.AuthUsers.CountAsync(),
                        Active = await _db.AuthUsers.CountAsync(u => u.IsActive),
                        Inactive = await _db.AuthUsers.CountAsync(u => !u.IsActive)
                    },
                    Tickets = new
                    {
                        Total = await _db.Tickets.CountAsync(),
                        Open = await _db.Tickets.CountAsync(t => t.Estado == "Pendiente" || t.Estado == "En Proceso"),
                        Closed = await _db.Tickets.CountAsync(t => t.Estado == "Cerrado")
                    },
                    Activos = new
                    {
                        Total = await _db.Activos.CountAsync(),
                        Assigned = await _db.AsignacionesActivos.CountAsync(aa => aa.Estado == "Activa"),
                        Available = await _db.Activos.CountAsync(a => a.Estado == "Disponible")
                    },
                    Storage = new
                    {
                        TotalFiles = Directory.GetFiles(Path.Combine(Directory.GetCurrentDirectory(), "Storage"), "*", SearchOption.AllDirectories).Length,
                        TotalSizeMB = GetDirectorySize(Path.Combine(Directory.GetCurrentDirectory(), "Storage")) / (1024 * 1024)
                    }
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener estadísticas del sistema");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/systemconfig/initialize
        [HttpPost("initialize")]
        public async Task<IActionResult> InitializeConfiguration()
        {
            try
            {
                var success = await _configService.InitializeDefaultConfigurationAsync();
                
                if (success)
                {
                    return Ok(new { message = "Configuración inicializada correctamente" });
                }
                else
                {
                    return StatusCode(500, "Error al inicializar configuración");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al inicializar configuración");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        private async Task LogActivity(int userId, string action, string description, object? details = null)
        {
            try
            {
                var log = new UserActivityLog
                {
                    UserId = userId,
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar actividad del usuario {UserId}", userId);
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }

        private string GetClientIpAddress()
        {
            var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                           Request.Headers["X-Real-IP"].FirstOrDefault() ??
                           Request.Headers["CF-Connecting-IP"].FirstOrDefault() ??
                           Request.HttpContext.Connection.RemoteIpAddress?.ToString();

            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1" || ipAddress == "127.0.0.1")
            {
                ipAddress = "Local";
            }

            return ipAddress ?? "Unknown";
        }

        private long GetDirectorySize(string path)
        {
            try
            {
                var dir = new DirectoryInfo(path);
                return dir.GetFiles("*", SearchOption.AllDirectories).Sum(fi => fi.Length);
            }
            catch
            {
                return 0;
            }
        }
    }

    public class UpdateSystemConfigRequest
    {
        public Dictionary<string, object>? Appearance { get; set; }
        public Dictionary<string, object>? Notifications { get; set; }
        public Dictionary<string, object>? Security { get; set; }
        public Dictionary<string, object>? Backup { get; set; }
        public Dictionary<string, object>? System { get; set; }
    }

    public class MaintenanceModeRequest
    {
        public bool Enabled { get; set; }
        public string? Message { get; set; }
    }
}
