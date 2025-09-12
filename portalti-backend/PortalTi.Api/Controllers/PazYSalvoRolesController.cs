using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using System.Security.Claims;
using System.Security.Cryptography;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PazYSalvoRolesController : ControllerBase
    {
        private readonly PortalTiContext _context;
        private readonly ILogger<PazYSalvoRolesController> _logger;

        public PazYSalvoRolesController(PortalTiContext context, ILogger<PazYSalvoRolesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todas las asignaciones de roles de Paz y Salvo
        /// </summary>
        [HttpGet("assignments")]
        public async Task<IActionResult> GetRoleAssignments()
        {
            try
            {
                var assignments = await _context.Database
                    .SqlQueryRaw<PazYSalvoRoleAssignmentDto>(@"
                        SELECT 
                            pra.Id,
                            pra.Departamento,
                            pra.Rol,
                            pra.UserId,
                            au.Username,
                            au.Username as Email,
                            au.Username as Nombre,
                            au.Username as Apellido,
                            au.Role as UserRole,
                            pra.IsActive,
                            pra.CreatedAt
                        FROM PazYSalvoRoleAssignments pra
                        INNER JOIN AuthUsers au ON pra.UserId = au.Id
                        WHERE pra.IsActive = 1 AND au.IsActive = 1
                        ORDER BY pra.Departamento, pra.Rol")
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignaciones de roles");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene las asignaciones de roles por departamento
        /// </summary>
        [HttpGet("assignments/department/{departamento}")]
        public async Task<IActionResult> GetRoleAssignmentsByDepartment(string departamento)
        {
            try
            {
                var assignments = await _context.Database
                    .SqlQueryRaw<PazYSalvoRoleAssignmentDto>(@"
                        SELECT 
                            pra.Id,
                            pra.Departamento,
                            pra.Rol,
                            pra.UserId,
                            au.Username,
                            au.Username as Email,
                            au.Username as Nombre,
                            au.Username as Apellido,
                            au.Role as UserRole,
                            pra.IsActive,
                            pra.CreatedAt
                        FROM PazYSalvoRoleAssignments pra
                        INNER JOIN AuthUsers au ON pra.UserId = au.Id
                        WHERE pra.Departamento = {0} AND pra.IsActive = 1 AND au.IsActive = 1
                        ORDER BY pra.Rol", departamento)
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener asignaciones de roles por departamento");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene los usuarios disponibles para asignación de roles
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.NominaUsuarios
                    .Select(u => new
                    {
                        // Usar el ID del AuthUser en lugar del NominaUsuario
                        Id = _context.AuthUsers
                            .Where(au => au.Username == u.Email && au.IsActive)
                            .Select(au => au.Id)
                            .FirstOrDefault(),
                        u.Nombre,
                        u.Apellido,
                        u.Email,
                        u.Departamento,
                        Cargo = "Empleado", // Valor por defecto ya que no existe en NominaUsuario
                        u.Rut,
                        // Obtener el rol del AuthUser correspondiente
                        Role = _context.AuthUsers
                            .Where(au => au.Username == u.Email)
                            .Select(au => au.Role)
                            .FirstOrDefault() ?? "usuario"
                    })
                    .Where(u => u.Id > 0) // Solo incluir usuarios que tienen AuthUser
                    .Select(u => new
                    {
                        Id = u.Id, // Ya es int
                        u.Nombre,
                        u.Apellido,
                        u.Email,
                        u.Departamento,
                        u.Cargo,
                        u.Rut,
                        u.Role
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios disponibles");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crea una nueva asignación de rol
        /// </summary>
        [HttpPost("assignments")]
        [Authorize(Policy = "RequireRRHHOrAdmin")]
        public async Task<IActionResult> CreateRoleAssignment([FromBody] CreateRoleAssignmentRequest request)
        {
            try
            {
                _logger.LogInformation("Iniciando creación de asignación de rol. UserId: {UserId}, Departamento: {Departamento}, Rol: {Rol}", 
                    request.UserId, request.Departamento, request.Rol);

                // Verificar que el usuario existe en AuthUsers
                var authUser = await _context.AuthUsers
                    .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive);

                if (authUser == null)
                {
                    _logger.LogWarning("Usuario no tiene cuenta de acceso activa. UserId: {UserId}", request.UserId);
                    return BadRequest("Usuario no tiene cuenta de acceso activa");
                }

                _logger.LogInformation("AuthUser encontrado. Id: {AuthUserId}, Username: {Username}", authUser.Id, authUser.Username);

                // Obtener el usuario de nómina correspondiente
                var nominaUser = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Email == authUser.Username);

                if (nominaUser == null)
                {
                    _logger.LogWarning("Usuario no encontrado en nómina. Email: {Email}", authUser.Username);
                    return BadRequest("Usuario no encontrado en nómina");
                }

                _logger.LogInformation("Usuario encontrado en nómina: {Email}, Departamento: {Departamento}", nominaUser.Email, nominaUser.Departamento);

                // Verificar que no existe ya una asignación activa para este rol y departamento
                _logger.LogInformation("Verificando asignaciones existentes...");
                var existingAssignment = await _context.PazYSalvoRoleAssignments
                    .AnyAsync(a => a.Departamento == request.Departamento && 
                                  a.Rol == request.Rol && 
                                  a.IsActive);

                _logger.LogInformation("Asignaciones existentes encontradas: {Exists}", existingAssignment);

                if (existingAssignment)
                {
                    _logger.LogWarning("Ya existe una asignación activa para este rol y departamento");
                    return BadRequest("Ya existe una asignación activa para este rol y departamento");
                }

                // Crear la asignación de subrol (no cambiar el rol principal)
                _logger.LogInformation("Creando nueva asignación de subrol...");
                var newAssignment = new PazYSalvoRoleAssignment
                {
                    Departamento = request.Departamento,
                    Rol = request.Rol,
                    UserId = request.UserId,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.PazYSalvoRoleAssignments.Add(newAssignment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Asignación de subrol creada exitosamente");
                return Ok(new { message = "Subrol de Paz y Salvo asignado exitosamente. El rol principal del usuario se mantiene." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear asignación de rol. UserId: {UserId}, Departamento: {Departamento}, Rol: {Rol}", 
                    request.UserId, request.Departamento, request.Rol);
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Actualiza una asignación de rol existente
        /// </summary>
        [HttpPut("assignments/{id}")]
        [Authorize(Policy = "RequireRRHHOrAdmin")]
        public async Task<IActionResult> UpdateRoleAssignment(int id, [FromBody] UpdateRoleAssignmentRequest request)
        {
            try
            {
                // Verificar que el usuario existe
                var user = await _context.AuthUsers
                    .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive);

                if (user == null)
                    return BadRequest("Usuario no encontrado o inactivo");

                // Actualizar la asignación
                var rowsAffected = await _context.Database.ExecuteSqlRawAsync(@"
                    UPDATE PazYSalvoRoleAssignments 
                    SET UserId = {0}, IsActive = {1}
                    WHERE Id = {2}",
                    request.UserId, request.IsActive, id);

                if (rowsAffected == 0)
                    return NotFound("Asignación no encontrada");

                return Ok(new { message = "Asignación actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar asignación de rol");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Desactiva una asignación de rol
        /// </summary>
        [HttpDelete("assignments/{id}")]
        [Authorize(Policy = "RequireRRHHOrAdmin")]
        public async Task<IActionResult> DeleteRoleAssignment(int id)
        {
            try
            {
                var rowsAffected = await _context.Database.ExecuteSqlRawAsync(@"
                    UPDATE PazYSalvoRoleAssignments 
                    SET IsActive = 0
                    WHERE Id = {0}", id);

                if (rowsAffected == 0)
                    return NotFound("Asignación no encontrada");

                return Ok(new { message = "Asignación desactivada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al desactivar asignación de rol");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crea automáticamente un jefe directo si no existe
        /// </summary>
        [HttpPost("create-jefe-directo")]
        [Authorize(Policy = "RequireRRHHOrAdmin")]
        public async Task<IActionResult> CreateJefeDirecto([FromBody] CreateJefeDirectoRequest request)
        {
            try
            {
                // Verificar si el usuario ya existe en la nómina
                var usuario = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Id == request.UsuarioId);

                if (usuario == null)
                    return BadRequest("Usuario no encontrado en la nómina");

                // Verificar si ya tiene un AuthUser
                var authUser = await _context.AuthUsers
                    .FirstOrDefaultAsync(au => au.Username == usuario.Email);

                if (authUser != null)
                {
                    // Si ya existe, NO cambiar el rol principal, solo crear la asignación de subrol
                    // El rol principal se mantiene (admin, soporte, usuario)
                    return Ok(new { message = "Usuario ya existe, se creará la asignación de subrol", userId = authUser.Id });
                }

                // Crear nuevo AuthUser
                var tempPassword = "TempPassword123!";
                var passwordHash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(tempPassword));
                var passwordSalt = new byte[32]; // Salt aleatorio
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(passwordSalt);
                }
                
                var newAuthUser = new AuthUser
                {
                    Username = usuario.Email,
                    PasswordHash = passwordHash, // Contraseña temporal
                    PasswordSalt = passwordSalt,
                    Role = "usuario", // Rol principal por defecto, no subrol
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.AuthUsers.Add(newAuthUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Jefe directo creado exitosamente", userId = newAuthUser.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear jefe directo");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene los subroles de Paz y Salvo del usuario actual
        /// </summary>
        [HttpGet("user-subroles")]
        [Authorize]
        public async Task<IActionResult> GetUserSubroles()
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                var userSubroles = await _context.PazYSalvoRoleAssignments
                    .Where(ra => ra.UserId == currentUserId && ra.IsActive)
                    .Select(ra => new
                    {
                        ra.Id,
                        ra.Departamento,
                        ra.Rol,
                        ra.IsActive,
                        ra.CreatedAt
                    })
                    .ToListAsync();

                return Ok(userSubroles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener subroles del usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Obtiene las delegaciones activas del usuario actual
        /// </summary>
        [HttpGet("delegations")]
        [Authorize]
        public async Task<IActionResult> GetUserDelegations()
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                // Por ahora devolvemos una lista vacía ya que el sistema de delegaciones no está completamente implementado
                var delegations = new List<object>();
                
                return Ok(delegations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener delegaciones del usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Endpoint de prueba para verificar conectividad
        /// </summary>
        [HttpGet("test-pazysalvo")]
        [AllowAnonymous]
        public IActionResult TestPazYSalvo()
        {
            return Ok(new { 
                message = "PazYSalvoRolesController funciona correctamente",
                timestamp = DateTime.Now
            });
        }

        /// <summary>
        /// Obtiene la configuración de firmas
        /// </summary>
        [HttpGet("config")]
        public async Task<IActionResult> GetFirmasConfig()
        {
            try
            {
                // Retornar configuración por defecto ya que eliminamos las configuraciones
                var config = new { 
                    Id = 1, 
                    Nombre = "Configuración por defecto",
                    FirmasConfig = new[] {
                        new { Rol = "JefeInmediato", Orden = 1, Obligatorio = true },
                        new { Rol = "Contabilidad", Orden = 2, Obligatorio = true },
                        new { Rol = "Informatica", Orden = 3, Obligatorio = true },
                        new { Rol = "GerenciaFinanzas", Orden = 4, Obligatorio = true }
                    }
                };

                if (config == null)
                    return NotFound("No hay configuración de firmas activa");

                var result = new
                {
                    Id = config.Id,
                    Nombre = config.Nombre,
                    Activo = true,
                    RequiereCierreSinActivos = true,
                    PermiteDelegacion = true,
                    Firmas = config.FirmasConfig
                        .OrderBy(f => f.Orden)
                        .Select(f => new
                        {
                            Id = 1,
                            Rol = f.Rol,
                            Orden = f.Orden,
                            Obligatorio = f.Obligatorio,
                            Estado = "Activo"
                        })
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener configuración de firmas");
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }

    // DTOs
    public class PazYSalvoRoleAssignmentDto
    {
        public int Id { get; set; }
        public string Departamento { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRoleAssignmentRequest
    {
        public string Departamento { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public int UserId { get; set; }
    }

    public class UpdateRoleAssignmentRequest
    {
        public int UserId { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateJefeDirectoRequest
    {
        public int UsuarioId { get; set; }
    }
}
