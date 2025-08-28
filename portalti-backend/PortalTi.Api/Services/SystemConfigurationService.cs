using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Text.Json;

namespace PortalTi.Api.Services
{
    public interface ISystemConfigurationService
    {
        Task<Dictionary<string, object>> GetConfigurationAsync();
        Task<bool> UpdateConfigurationAsync(string category, string key, string value, int userId);
        Task<bool> UpdateConfigurationAsync(string category, Dictionary<string, object> config, int userId);
        Task<string> GetValueAsync(string category, string key, string defaultValue = "");
        Task<T> GetValueAsync<T>(string category, string key, T defaultValue = default);
        Task<bool> SetValueAsync(string category, string key, string value, int userId);
        Task<bool> InitializeDefaultConfigurationAsync();
    }

    public class SystemConfigurationService : ISystemConfigurationService
    {
        private readonly PortalTiContext _db;
        private readonly ILogger<SystemConfigurationService> _logger;
        private readonly IConfiguration _config;

        public SystemConfigurationService(PortalTiContext db, ILogger<SystemConfigurationService> logger, IConfiguration config)
        {
            _db = db;
            _logger = logger;
            _config = config;
        }

        public async Task<Dictionary<string, object>> GetConfigurationAsync()
        {
            try
            {
                var configs = await _db.SystemConfigurations.ToListAsync();
                var result = new Dictionary<string, object>();

                foreach (var config in configs)
                {
                    if (!result.ContainsKey(config.Category))
                    {
                        result[config.Category] = new Dictionary<string, object>();
                    }

                    var categoryDict = (Dictionary<string, object>)result[config.Category];
                    categoryDict[config.Key] = ParseValue(config.Value);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener configuración del sistema");
                return await GetDefaultConfigurationAsync();
            }
        }

        public async Task<bool> UpdateConfigurationAsync(string category, string key, string value, int userId)
        {
            try
            {
                var existingConfig = await _db.SystemConfigurations
                    .FirstOrDefaultAsync(c => c.Category == category && c.Key == key);

                if (existingConfig != null)
                {
                    existingConfig.Value = value;
                    existingConfig.LastModified = DateTime.Now;
                    existingConfig.ModifiedByUserId = userId;
                }
                else
                {
                    var newConfig = new SystemConfiguration
                    {
                        Category = category,
                        Key = key,
                        Value = value,
                        LastModified = DateTime.Now,
                        ModifiedByUserId = userId,
                        Description = GetDescription(category, key)
                    };
                    _db.SystemConfigurations.Add(newConfig);
                }

                await _db.SaveChangesAsync();
                _logger.LogInformation("Configuración actualizada: {Category}.{Key} = {Value}", category, key, value);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar configuración: {Category}.{Key}", category, key);
                return false;
            }
        }

        public async Task<bool> UpdateConfigurationAsync(string category, Dictionary<string, object> config, int userId)
        {
            try
            {
                foreach (var kvp in config)
                {
                    await UpdateConfigurationAsync(category, kvp.Key, kvp.Value?.ToString() ?? "", userId);
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar configuración de categoría: {Category}", category);
                return false;
            }
        }

        public async Task<string> GetValueAsync(string category, string key, string defaultValue = "")
        {
            try
            {
                var config = await _db.SystemConfigurations
                    .FirstOrDefaultAsync(c => c.Category == category && c.Key == key);
                
                return config?.Value ?? defaultValue;
            }
            catch
            {
                return defaultValue;
            }
        }

        public async Task<T> GetValueAsync<T>(string category, string key, T defaultValue = default)
        {
            try
            {
                var value = await GetValueAsync(category, key, "");
                if (string.IsNullOrEmpty(value))
                    return defaultValue;

                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch
            {
                return defaultValue;
            }
        }

        public async Task<bool> SetValueAsync(string category, string key, string value, int userId)
        {
            return await UpdateConfigurationAsync(category, key, value, userId);
        }

        public async Task<bool> InitializeDefaultConfigurationAsync()
        {
            try
            {
                var defaultConfig = await GetDefaultConfigurationAsync();
                
                foreach (var category in defaultConfig)
                {
                    if (category.Value is Dictionary<string, object> categoryDict)
                    {
                        foreach (var kvp in categoryDict)
                        {
                            await UpdateConfigurationAsync(category.Key, kvp.Key, kvp.Value?.ToString() ?? "", 1);
                        }
                    }
                }

                _logger.LogInformation("Configuración por defecto inicializada correctamente");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al inicializar configuración por defecto");
                return false;
            }
        }

        private async Task<Dictionary<string, object>> GetDefaultConfigurationAsync()
        {
            return new Dictionary<string, object>
            {
                ["Appearance"] = new Dictionary<string, object>
                {
                    ["SystemName"] = _config["System:Name"] ?? "Portal IT",
                    ["PrimaryColor"] = _config["System:PrimaryColor"] ?? "#3B82F6",
                    ["Theme"] = _config["System:Theme"] ?? "light"
                },
                ["Notifications"] = new Dictionary<string, object>
                {
                    ["EmailEnabled"] = _config.GetValue<bool>("Notifications:Email:Enabled", true),
                    ["PushEnabled"] = _config.GetValue<bool>("Notifications:Push:Enabled", true),
                    ["SlackWebhook"] = _config["Notifications:Slack:Webhook"] ?? "",
                    ["TeamsWebhook"] = _config["Notifications:Teams:Webhook"] ?? ""
                },
                ["Security"] = new Dictionary<string, object>
                {
                    ["SessionTimeoutMinutes"] = _config.GetValue<int>("Security:SessionTimeoutMinutes", 60),
                    ["ForcePasswordChange"] = _config.GetValue<bool>("Security:ForcePasswordChange", false),
                    ["PasswordMinLength"] = _config.GetValue<int>("Security:PasswordMinLength", 8),
                    ["RequireSpecialChars"] = _config.GetValue<bool>("Security:RequireSpecialChars", true),
                    ["MaxLoginAttempts"] = _config.GetValue<int>("Security:MaxLoginAttempts", 5),
                    ["LockoutDurationMinutes"] = _config.GetValue<int>("Security:LockoutDurationMinutes", 15)
                },
                ["Backup"] = new Dictionary<string, object>
                {
                    ["AutoBackupEnabled"] = _config.GetValue<bool>("Backup:AutoBackupEnabled", false),
                    ["BackupFrequency"] = _config["Backup:Frequency"] ?? "daily",
                    ["BackupRetentionDays"] = _config.GetValue<int>("Backup:RetentionDays", 30),
                    ["BackupPath"] = _config["Backup:Path"] ?? "./backups"
                },
                ["System"] = new Dictionary<string, object>
                {
                    ["MaintenanceMode"] = _config.GetValue<bool>("System:MaintenanceMode", false),
                    ["MaintenanceMessage"] = _config["System:MaintenanceMessage"] ?? "Sistema en mantenimiento",
                    ["MaxFileSizeMB"] = _config.GetValue<int>("System:MaxFileSizeMB", 10),
                    ["AllowedFileTypes"] = _config["System:AllowedFileTypes"] ?? "jpg,jpeg,png,pdf,doc,docx"
                }
            };
        }

        private object ParseValue(string value)
        {
            if (bool.TryParse(value, out bool boolResult))
                return boolResult;
            
            if (int.TryParse(value, out int intResult))
                return intResult;
            
            if (decimal.TryParse(value, out decimal decimalResult))
                return decimalResult;
            
            return value;
        }

        private string GetDescription(string category, string key)
        {
            var descriptions = new Dictionary<string, Dictionary<string, string>>
            {
                ["Appearance"] = new Dictionary<string, string>
                {
                    ["SystemName"] = "Nombre del sistema mostrado en la interfaz",
                    ["PrimaryColor"] = "Color primario del tema",
                    ["Theme"] = "Tema de la interfaz (claro/oscuro/automático)"
                },
                ["Notifications"] = new Dictionary<string, string>
                {
                    ["EmailEnabled"] = "Habilitar notificaciones por email",
                    ["PushEnabled"] = "Habilitar notificaciones push",
                    ["SlackWebhook"] = "Webhook de Slack para notificaciones",
                    ["TeamsWebhook"] = "Webhook de Microsoft Teams para notificaciones"
                },
                ["Security"] = new Dictionary<string, string>
                {
                    ["SessionTimeoutMinutes"] = "Tiempo de expiración de sesión en minutos",
                    ["ForcePasswordChange"] = "Forzar cambio de contraseña en el próximo login",
                    ["PasswordMinLength"] = "Longitud mínima de contraseña",
                    ["RequireSpecialChars"] = "Requerir caracteres especiales en contraseñas",
                    ["MaxLoginAttempts"] = "Máximo número de intentos de login",
                    ["LockoutDurationMinutes"] = "Duración del bloqueo de cuenta en minutos"
                },
                ["Backup"] = new Dictionary<string, string>
                {
                    ["AutoBackupEnabled"] = "Habilitar backup automático",
                    ["BackupFrequency"] = "Frecuencia de backup automático",
                    ["BackupRetentionDays"] = "Días de retención de backups",
                    ["BackupPath"] = "Ruta donde se almacenan los backups"
                },
                ["System"] = new Dictionary<string, string>
                {
                    ["MaintenanceMode"] = "Activar modo mantenimiento",
                    ["MaintenanceMessage"] = "Mensaje mostrado en modo mantenimiento",
                    ["MaxFileSizeMB"] = "Tamaño máximo de archivo en MB",
                    ["AllowedFileTypes"] = "Tipos de archivo permitidos (separados por coma)"
                }
            };

            return descriptions.GetValueOrDefault(category)?.GetValueOrDefault(key) ?? $"Configuración de {category}.{key}";
        }
    }
}

