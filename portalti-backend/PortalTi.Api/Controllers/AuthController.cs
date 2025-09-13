// AuthController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using System.Text.Json;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Protege todos los endpoints excepto los que tengan [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly PortalTiContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthController> _logger;
        private readonly IWebHostEnvironment _env;

        public AuthController(PortalTiContext db, IConfiguration config, ILogger<AuthController> logger, IWebHostEnvironment env)
        {
            _db = db;
            _config = config;
            _logger = logger;
            _env = env;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest req)
        {
            try
            {
                // Validar que el email no esté ya registrado
                if (await _db.AuthUsers.AnyAsync(u => u.Username == req.Email))
                    return BadRequest(new { message = "El correo ya está registrado." });

                // Normalizar el RUT para la búsqueda (remover puntos y guiones)
                var rutNormalizado = req.Rut.Replace(".", "").Replace("-", "");
                
                // Buscar en la nómina de usuarios
                var nominaUsuario = await _db.NominaUsuarios
                    .FirstOrDefaultAsync(n => 
                        (n.Rut.Replace(".", "").Replace("-", "") == rutNormalizado) && 
                        n.Email == req.Email);

                if (nominaUsuario == null)
                    return BadRequest(new { message = "El RUT y correo no coinciden con la nómina de empleados." });

                // Crear el usuario del sistema
                using var hmac = new HMACSHA512();
                var user = new AuthUser
                {
                    Username = req.Email, // Usar email como username
                    Role = "usuario", // Rol por defecto para nuevos registros
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(req.Password)),
                    PasswordSalt = hmac.Key,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _db.AuthUsers.Add(user);
                await _db.SaveChangesAsync();

                // Notificar nuevo usuario registrado
                try
                {
                    var notificationService = HttpContext.RequestServices.GetRequiredService<INotificationsService>();
                    
                    // Notificar a admins sobre nuevo usuario
                    await notificationService.CreateForAdminsAsync(new CreateNotificationDto
                    {
                        UserId = 0,
                        Tipo = "user",
                        Titulo = "Nuevo usuario registrado",
                        Mensaje = $"Se ha registrado un nuevo usuario: {nominaUsuario.Nombre} {nominaUsuario.Apellido} ({req.Email})",
                        RefTipo = "Usuario",
                        RefId = user.Id,
                        Ruta = $"/usuarios/{user.Id}"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error notificando nuevo usuario: {ex.Message}");
                }

                // Log de actividad
                await LogActivity(user.Id, "register", "Usuario registrado", new { 
                    email = req.Email, 
                    rut = req.Rut,
                    nombre = nominaUsuario.Nombre,
                    apellido = nominaUsuario.Apellido
                });

                return Ok(new { 
                    message = "Usuario registrado exitosamente",
                    user = new { user.Id, user.Username, user.Role }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en registro de usuario");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest req)
        {
            var user = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user == null)
                return Unauthorized("Usuario o contraseña incorrecta.");

            if (!user.IsActive)
                return Unauthorized("Usuario desactivado.");

            using var hmac = new HMACSHA512(user.PasswordSalt);
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(req.Password));
            if (!hash.SequenceEqual(user.PasswordHash))
                return Unauthorized("Usuario o contraseña incorrecta.");

            // Actualizar último login
            user.LastLoginAt = DateTime.Now;
            await _db.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            // Log de actividad
            await LogActivity(user.Id, "login", "Inicio de sesión", new { ip = GetClientIpAddress() });

            // Obtener datos del perfil desde NominaUsuarios
            var perfilUsuario = await _db.NominaUsuarios
                .FirstOrDefaultAsync(n => n.Email == user.Username);

            // Obtener subroles de Paz y Salvo con empresa
            var subroles = await _db.PazYSalvoRoleAssignments
                .Where(p => p.UserId == user.Id && p.IsActive)
                .Select(p => new { p.Rol, p.Empresa })
                .ToListAsync();

            return Ok(new { 
                token, 
                user = new { 
                    user.Id, 
                    user.Username, 
                    user.Role, 
                    user.SignaturePath,
                    subroles = subroles,
                    nombre = perfilUsuario?.Nombre ?? "",
                    apellido = perfilUsuario?.Apellido ?? "",
                    empresa = perfilUsuario?.Empresa ?? "Empresa A",
                    ubicacion = perfilUsuario?.Ubicacion ?? "",
                    departamento = perfilUsuario?.Departamento ?? ""
                } 
            });
        }

        // GET: api/auth - Listar todos los usuarios (solo admin)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllUsers()
        {
            try
            {
                var users = await _db.AuthUsers
                    .OrderByDescending(u => u.CreatedAt)
                    .ToListAsync();

                var result = users.Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt,
                    u.LastLoginAt,
                    Preferencias = !string.IsNullOrEmpty(u.PreferenciasJson) 
                        ? JsonSerializer.Deserialize<object>(u.PreferenciasJson) 
                        : null
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/auth/usuarios - Listar usuarios asignables (solo admin/soporte)
        [HttpGet("usuarios")]
        [Authorize(Roles = "admin,soporte")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsuarios()
        {
            try
            {
                var users = await _db.AuthUsers
                    .Where(u => u.IsActive)
                    .Select(u => new
                    {
                        // Campos esperados por el frontend
                        id = u.Id,
                        userId = u.Id,
                        authId = u.Id,
                        username = u.Username,
                        role = u.Role,
                        isActive = u.IsActive,

                        // Datos de nómina con valores por defecto seguros
                        nominaId = _db.NominaUsuarios
                            .Where(n => n.Email == u.Username)
                            .Select(n => (int?)n.Id)
                            .FirstOrDefault() ?? u.Id,
                        empresa = _db.NominaUsuarios
                            .Where(n => n.Email == u.Username)
                            .Select(n => n.Empresa)
                            .FirstOrDefault(),
                        ubicacion = _db.NominaUsuarios
                            .Where(n => n.Email == u.Username)
                            .Select(n => n.Ubicacion)
                            .FirstOrDefault(),
                        departamento = _db.NominaUsuarios
                            .Where(n => n.Email == u.Username)
                            .Select(n => n.Departamento)
                            .FirstOrDefault(),
                        nombre = _db.NominaUsuarios
                            .Where(n => n.Email == u.Username)
                            .Select(n => n.Nombre)
                            .FirstOrDefault(),
                        apellido = _db.NominaUsuarios
                            .Where(n => n.Email == u.Username)
                            .Select(n => n.Apellido)
                            .FirstOrDefault()
                    })
                    .AsNoTracking()
                    .ToListAsync();

                // Aplicar fallbacks para evitar strings vacíos/null en campos críticos
                var usersWithDefaults = users
                    .Select(u => new
                    {
                        u.id,
                        u.userId,
                        u.authId,
                        u.username,
                        u.role,
                        u.isActive,
                        nominaId = u.nominaId,
                        empresa = !string.IsNullOrWhiteSpace(u.empresa) ? u.empresa : "Vicsa",
                        ubicacion = !string.IsNullOrWhiteSpace(u.ubicacion) ? u.ubicacion : "No especificada",
                        departamento = !string.IsNullOrWhiteSpace(u.departamento) ? u.departamento : "No especificado",
                        nombre = !string.IsNullOrWhiteSpace(u.nombre) ? u.nombre : u.username,
                        apellido = !string.IsNullOrWhiteSpace(u.apellido) ? u.apellido : string.Empty
                    })
                    .OrderBy(u => u.username)
                    .ToList();

                return Ok(usersWithDefaults);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        // GET: api/auth/{id} - Obtener usuario por ID (solo admin o self)
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetUser(int id)
        {
            try
            {
                // Verificar si es admin o el propio usuario
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (currentUserRole != "admin" && currentUserId != id.ToString())
                    return Forbid();

                var user = await _db.AuthUsers.FindAsync(id);
                if (user == null)
                    return NotFound("Usuario no encontrado.");

                var result = new
                {
                    user.Id,
                    user.Username,
                    user.Role,
                    user.IsActive,
                    user.CreatedAt,
                    user.LastLoginAt,
                    user.SignaturePath,
                    Preferencias = !string.IsNullOrEmpty(user.PreferenciasJson)
                        ? JsonSerializer.Deserialize<object>(user.PreferenciasJson)
                        : null
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/auth/{id} - Editar usuario (solo admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest req)
        {
            try
            {
                var user = await _db.AuthUsers.FindAsync(id);
                if (user == null)
                    return NotFound("Usuario no encontrado.");

                // Verificar si el username ya existe (si se está cambiando)
                if (!string.IsNullOrEmpty(req.Username) && req.Username != user.Username)
                {
                    if (await _db.AuthUsers.AnyAsync(u => u.Username == req.Username))
                        return BadRequest("El nombre de usuario ya existe.");
                }

                // Actualizar campos
                if (!string.IsNullOrEmpty(req.Username))
                    user.Username = req.Username;
                if (!string.IsNullOrEmpty(req.Role))
                    user.Role = req.Role;
                if (req.IsActive.HasValue)
                    user.IsActive = req.IsActive.Value;

                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity(user.Id, "update_user", "Usuario actualizado", new { 
                    updatedBy = User.FindFirst(ClaimTypes.Name)?.Value,
                    changes = new { username = req.Username, role = req.Role, isActive = req.IsActive }
                });

                return Ok("Usuario actualizado correctamente.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/auth/{id}/reset-password - Resetear contraseña (solo admin)
        [HttpPut("{id}/reset-password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ResetPassword(int id, ResetPasswordRequest req)
        {
            try
            {
                var user = await _db.AuthUsers.FindAsync(id);
                if (user == null)
                    return NotFound("Usuario no encontrado.");

                using var hmac = new HMACSHA512();
                user.PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(req.NewPassword));
                user.PasswordSalt = hmac.Key;

                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity(user.Id, "reset_password", "Contraseña reseteada", new { 
                    resetBy = User.FindFirst(ClaimTypes.Name)?.Value 
                });

                return Ok("Contraseña reseteada correctamente.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al resetear contraseña del usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // PUT: api/auth/{id}/preferencias - Actualizar preferencias
        [HttpPut("{id}/preferencias")]
        public async Task<IActionResult> UpdatePreferences(int id, UpdatePreferencesRequest req)
        {
            try
            {
                // Verificar si es admin o el propio usuario
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (currentUserRole != "admin" && currentUserId != id.ToString())
                    return Forbid();

                var user = await _db.AuthUsers.FindAsync(id);
                if (user == null)
                    return NotFound("Usuario no encontrado.");

                user.PreferenciasJson = JsonSerializer.Serialize(req.Preferencias);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity(user.Id, "update_preferences", "Preferencias actualizadas", new { 
                    updatedBy = User.FindFirst(ClaimTypes.Name)?.Value 
                });

                return Ok("Preferencias actualizadas correctamente.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar preferencias del usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // DELETE: api/auth/{id} - Eliminar usuario (solo admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _db.AuthUsers.FindAsync(id);
                if (user == null)
                    return NotFound("Usuario no encontrado.");

                _db.AuthUsers.Remove(user);
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity(id, "delete_user", "Usuario eliminado", new { 
                    deletedBy = User.FindFirst(ClaimTypes.Name)?.Value,
                    deletedUser = user.Username
                });

                return Ok("Usuario eliminado correctamente.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar usuario {UserId}", id);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // GET: api/auth/activity-log - Obtener log de actividades (solo admin)
        [HttpGet("activity-log")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetActivityLog(
            [FromQuery] int? userId = null,
            [FromQuery] string? action = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var query = _db.UserActivityLogs
                    .Include(log => log.User)
                    .AsQueryable();

                // Excluir completamente los logs de chat para evitar llenar la tabla
                query = query.Where(log => 
                    !log.Description.Contains("Mensaje enviado en conversación") &&
                    !log.Description.Contains("chat") &&
                    !log.Description.Contains("Chat") &&
                    log.Action != "Enviar mensaje de chat" &&
                    log.Action != "chat_message" &&
                    !log.Description.ToLower().Contains("conversación")
                );

                if (userId.HasValue)
                    query = query.Where(log => log.UserId == userId.Value);
                if (!string.IsNullOrEmpty(action))
                    query = query.Where(log => log.Action == action);
                if (fromDate.HasValue)
                    query = query.Where(log => log.Timestamp >= fromDate.Value);
                if (toDate.HasValue)
                    query = query.Where(log => log.Timestamp <= toDate.Value);

                var totalCount = await query.CountAsync();
                var logs = await query
                    .OrderByDescending(log => log.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var result = logs.Select(log => new
                {
                    log.Id,
                    log.Action,
                    log.Description,
                    log.Details,
                    log.Timestamp,
                    log.IpAddress,
                    log.UserAgent,
                    User = new
                    {
                        log.User.Id,
                        log.User.Username,
                        log.User.Role
                    }
                });

                return Ok(new
                {
                    logs = result,
                    pagination = new
                    {
                        page,
                        pageSize,
                        totalCount,
                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener log de actividades");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/auth/activate-all-users - Endpoint temporal para activar todos los usuarios
        [HttpPost("activate-all-users")]
        [AllowAnonymous] // Temporalmente sin autenticación para emergencias
        public async Task<IActionResult> ActivateAllUsers()
        {
            try
            {
                var users = await _db.AuthUsers.ToListAsync();
                var updatedCount = 0;

                foreach (var user in users)
                {
                    if (!user.IsActive)
                    {
                        user.IsActive = true;
                        updatedCount++;
                    }
                }

                if (updatedCount > 0)
                {
                    await _db.SaveChangesAsync();
                    return Ok($"Se activaron {updatedCount} usuarios.");
                }

                return Ok("Todos los usuarios ya están activos.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar usuarios");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        // POST: api/auth/clean-chat-logs - Endpoint temporal para limpiar logs de chat
        [HttpPost("clean-chat-logs")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CleanChatLogs()
        {
            try
            {
                // Eliminar logs de chat existentes
                var chatLogs = await _db.UserActivityLogs
                    .Where(log => 
                        log.Description.Contains("Mensaje enviado en conversación") ||
                        log.Description.Contains("chat") ||
                        log.Description.Contains("Chat") ||
                        log.Action == "Enviar mensaje de chat" ||
                        log.Action == "chat_message" ||
                        log.Description.ToLower().Contains("conversación")
                    )
                    .ToListAsync();

                var deletedCount = chatLogs.Count;
                _db.UserActivityLogs.RemoveRange(chatLogs);
                await _db.SaveChangesAsync();

                return Ok($"Se eliminaron {deletedCount} logs de chat del historial.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al limpiar logs de chat");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
        {
            // Obtener el ID del usuario desde el token JWT
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int id))
                return Unauthorized("Usuario no autenticado.");

            var user = await _db.AuthUsers.FindAsync(id);
            if (user == null)
                return NotFound("Usuario no encontrado.");

            // Verificar la contraseña actual
            using var hmac = new HMACSHA512(user.PasswordSalt);
            var currentHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(req.CurrentPassword));
            if (!currentHash.SequenceEqual(user.PasswordHash))
                return BadRequest("La contraseña actual es incorrecta.");

            // Generar nuevo hash para la nueva contraseña
            using var newHmac = new HMACSHA512();
            user.PasswordHash = newHmac.ComputeHash(Encoding.UTF8.GetBytes(req.NewPassword));
            user.PasswordSalt = newHmac.Key;

            await _db.SaveChangesAsync();

            // Log de actividad
            await LogActivity(user.Id, "change_password", "Contraseña cambiada");

            return Ok("Contraseña cambiada correctamente.");
        }

        private string GenerateJwtToken(AuthUser user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var jwtKey = _config["JwtSettings:SecretKey"];
            if (string.IsNullOrEmpty(jwtKey))
                throw new InvalidOperationException("JWT Key no está configurada");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var durationMinutesStr = _config["JwtSettings:ExpirationMinutes"];
            if (string.IsNullOrEmpty(durationMinutesStr) || !int.TryParse(durationMinutesStr, out int durationMinutes))
                durationMinutes = 60; // Default a 60 minutos

            var jwt = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(durationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(jwt);
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

        public class RegisterRequest
        {
            public required string Rut { get; set; }
            public required string Email { get; set; }
            public required string Password { get; set; }
        }

        public class LoginRequest
        {
            public required string Username { get; set; }
            public required string Password { get; set; }
        }

        [HttpPost("upload-signature")]
        public async Task<IActionResult> UploadSignature(IFormFile signature)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                var user = await _db.AuthUsers.FindAsync(userId);
                if (user == null)
                    return NotFound("Usuario no encontrado");

                if (signature == null || signature.Length == 0)
                    return BadRequest("No se proporcionó ningún archivo");

                if (!signature.ContentType.StartsWith("image/"))
                    return BadRequest("Solo se permiten archivos de imagen");

                // Ruta raíz de almacenamiento privado
                var storageRoot = _config["Storage:Root"] ?? Path.Combine(_env.ContentRootPath, "Storage");
                
                // Si es una ruta relativa, resolverla desde el directorio del proyecto
                if (!Path.IsPathRooted(storageRoot))
                {
                    storageRoot = Path.Combine(_env.ContentRootPath, storageRoot);
                }
                var signaturesDir = Path.Combine(storageRoot, "signatures");
                
                _logger.LogInformation($"UploadSignature - StorageRoot: {storageRoot}");
                _logger.LogInformation($"UploadSignature - SignaturesDir: {signaturesDir}");
                _logger.LogInformation($"UploadSignature - Directory.Exists: {Directory.Exists(signaturesDir)}");
                
                Directory.CreateDirectory(signaturesDir);

                // Eliminar firma anterior si existe (soporta rutas en wwwroot o en storage)
                if (!string.IsNullOrEmpty(user.SignaturePath))
                {
                    var oldRel = user.SignaturePath.TrimStart('/');
                    var oldStorage = oldRel.StartsWith("storage/")
                        ? Path.Combine(storageRoot, oldRel.Substring("storage/".Length))
                        : Path.Combine(storageRoot, oldRel);
                    var oldWwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", oldRel);
                    if (System.IO.File.Exists(oldStorage)) System.IO.File.Delete(oldStorage);
                    else if (System.IO.File.Exists(oldWwwroot)) System.IO.File.Delete(oldWwwroot);
                }

                // Generar nombre único para el archivo conservando extensión
                var ext = Path.GetExtension(signature.FileName);
                if (string.IsNullOrEmpty(ext)) ext = ".png";
                var fileName = $"signature_{userId}_{DateTime.Now:yyyyMMddHHmmss}{ext}";
                var filePath = Path.Combine(signaturesDir, fileName);

                // Guardar archivo de forma segura en almacenamiento privado
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await signature.CopyToAsync(stream);
                }

                // Guardar ruta lógica segura
                user.SignaturePath = $"/storage/signatures/{fileName}";
                await _db.SaveChangesAsync();

                _logger.LogInformation($"UploadSignature - Archivo guardado exitosamente: {filePath}");
                _logger.LogInformation($"UploadSignature - SignaturePath guardado: {user.SignaturePath}");

                // Log de actividad
                await LogActivity(userId.Value, "upload_signature", "Firma digital subida", new { fileName });

                return Ok(new { message = "Firma subida exitosamente", signaturePath = user.SignaturePath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al subir firma para usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpDelete("remove-signature")]
        public async Task<IActionResult> RemoveSignature()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                var user = await _db.AuthUsers.FindAsync(userId);
                if (user == null)
                    return NotFound("Usuario no encontrado");

                // Eliminar archivo si existe (soporta rutas en storage o wwwroot)
                if (!string.IsNullOrEmpty(user.SignaturePath))
                {
                    var storageRoot = _config["Storage:Root"] ?? Path.Combine(_env.ContentRootPath, "Storage");
                    string filePathStorage = user.SignaturePath.StartsWith("/storage/")
                        ? Path.Combine(storageRoot, user.SignaturePath.Replace("/storage/", string.Empty))
                        : Path.Combine(storageRoot, user.SignaturePath.TrimStart('/'));
                    string filePathWwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.SignaturePath.TrimStart('/'));
                    if (System.IO.File.Exists(filePathStorage)) System.IO.File.Delete(filePathStorage);
                    else if (System.IO.File.Exists(filePathWwwroot)) System.IO.File.Delete(filePathWwwroot);
                }

                // Limpiar ruta de la firma
                user.SignaturePath = null;
                await _db.SaveChangesAsync();

                // Log de actividad
                await LogActivity(userId.Value, "remove_signature", "Firma digital eliminada", null);

                return Ok(new { message = "Firma eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar firma para usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("me")]
        public async Task<ActionResult<object>> GetCurrentUser()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                var user = await _db.AuthUsers.FindAsync(userId.Value);
                if (user == null)
                    return NotFound("Usuario no encontrado.");

                // Obtener datos del perfil desde NominaUsuarios
                var perfilUsuario = await _db.NominaUsuarios
                    .FirstOrDefaultAsync(n => n.Email == user.Username);

                var result = new
                {
                    user.Id,
                    user.Username,
                    user.Role,
                    user.IsActive,
                    user.CreatedAt,
                    user.LastLoginAt,
                    user.SignaturePath,
                    nombre = perfilUsuario?.Nombre ?? "",
                    apellido = perfilUsuario?.Apellido ?? "",
                    empresa = perfilUsuario?.Empresa ?? "Empresa A",
                    ubicacion = perfilUsuario?.Ubicacion ?? "",
                    departamento = perfilUsuario?.Departamento ?? "",
                    Preferencias = !string.IsNullOrEmpty(user.PreferenciasJson)
                        ? JsonSerializer.Deserialize<object>(user.PreferenciasJson)
                        : null
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuario actual");
                return StatusCode(500, "Error interno del servidor");
            }
        }



        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }

        public class ChangePasswordRequest
        {
            public required string CurrentPassword { get; set; }
            public required string NewPassword { get; set; }
        }

        public class UpdateUserRequest
        {
            public string? Username { get; set; }
            public string? Role { get; set; }
            public bool? IsActive { get; set; }
        }

        public class ResetPasswordRequest
        {
            public required string NewPassword { get; set; }
        }

        public class UpdatePreferencesRequest
        {
            public required object Preferencias { get; set; }
        }
    }
}
