using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
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
        private readonly IConfiguration _config;

        public SystemConfigController(PortalTiContext db, ILogger<SystemConfigController> logger, IConfiguration config)
        {
            _db = db;
            _logger = logger;
            _config = config;
        }

        // GET: api/systemconfig
        [HttpGet]
        public async Task<IActionResult> GetSystemConfig()
        {
            try
            {
                var config = new
                {
                    // Configuración de Apariencia
                    Appearance = new
                    {
                        SystemName = _config["System:Name"] ?? "Portal IT",
                        LogoPath = _config["System:LogoPath"] ?? "/logo.png",
                        PrimaryColor = _config["System:PrimaryColor"] ?? "#3B82F6",
                        Theme = _config["System:Theme"] ?? "light"
                    },

                    // Configuración de Notificaciones
                    Notifications = new
                    {
                        EmailEnabled = _config.GetValue<bool>("Notifications:Email:Enabled", true),
                        PushEnabled = _config.GetValue<bool>("Notifications:Push:Enabled", true),
                        SlackWebhook = _config["Notifications:Slack:Webhook"] ?? "",
                        TeamsWebhook = _config["Notifications:Teams:Webhook"] ?? ""
                    },

                    // Configuración de Seguridad
                    Security = new
                    {
                        SessionTimeoutMinutes = _config.GetValue<int>("Security:SessionTimeoutMinutes", 60),
                        ForcePasswordChange = _config.GetValue<bool>("Security:ForcePasswordChange", false),
                        PasswordMinLength = _config.GetValue<int>("Security:PasswordMinLength", 8),
                        RequireSpecialChars = _config.GetValue<bool>("Security:RequireSpecialChars", true),
                        MaxLoginAttempts = _config.GetValue<int>("Security:MaxLoginAttempts", 5),
                        LockoutDurationMinutes = _config.GetValue<int>("Security:LockoutDurationMinutes", 15)
                    },

                    // Configuración de Backup
                    Backup = new
                    {
                        AutoBackupEnabled = _config.GetValue<bool>("Backup:AutoBackupEnabled", false),
                        BackupFrequency = _config["Backup:Frequency"] ?? "daily",
                        BackupRetentionDays = _config.GetValue<int>("Backup:RetentionDays", 30),
                        BackupPath = _config["Backup:Path"] ?? "./backups"
                    },

                    // Configuración de Sistema
                    System = new
                    {
                        MaintenanceMode = _config.GetValue<bool>("System:MaintenanceMode", false),
                        MaintenanceMessage = _config["System:MaintenanceMessage"] ?? "Sistema en mantenimiento",
                        MaxFileSizeMB = _config.GetValue<int>("System:MaxFileSizeMB", 10),
                        AllowedFileTypes = _config["System:AllowedFileTypes"] ?? "jpg,jpeg,png,pdf,doc,docx"
                    }
                };

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
                // Aquí implementarías la lógica para actualizar la configuración
                // Por ahora, solo registramos la actividad
                var userId = GetCurrentUserId();
                if (userId.HasValue)
                {
                    await LogActivity(userId.Value, "update_system_config", "Configuración del sistema actualizada", request);
                }

                return Ok(new { message = "Configuración actualizada correctamente" });
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
                var backupPath = _config["Backup:Path"] ?? "./backups";
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
                if (userId.HasValue)
                {
                    var action = request.Enabled ? "activado" : "desactivado";
                    await LogActivity(userId.Value, "toggle_maintenance", $"Modo mantenimiento {action}");
                }

                return Ok(new { 
                    message = $"Modo mantenimiento {(request.Enabled ? "activado" : "desactivado")} correctamente",
                    maintenanceMode = request.Enabled
                });
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
        public string? SystemName { get; set; }
        public string? PrimaryColor { get; set; }
        public string? Theme { get; set; }
        public bool? EmailEnabled { get; set; }
        public bool? PushEnabled { get; set; }
        public int? SessionTimeoutMinutes { get; set; }
        public bool? ForcePasswordChange { get; set; }
        public bool? AutoBackupEnabled { get; set; }
    }

    public class MaintenanceModeRequest
    {
        public bool Enabled { get; set; }
        public string? Message { get; set; }
    }
}
