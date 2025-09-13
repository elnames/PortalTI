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
                            pra.Empresa,
                            pra.UserId,
                            au.Username,
                            au.Username as Email,
                            COALESCE(nu.Nombre, au.Username) as Nombre,
                            COALESCE(nu.Apellido, '') as Apellido,
                            au.Role as UserRole,
                            pra.IsActive,
                            pra.CreatedAt
                        FROM PazYSalvoRoleAssignments pra
                        INNER JOIN AuthUsers au ON pra.UserId = au.Id
                        LEFT JOIN NominaUsuarios nu ON au.Username = nu.Email
                        WHERE pra.IsActive = 1 AND au.IsActive = 1
                        ORDER BY pra.Departamento, pra.Rol")
                    .ToListAsync();

                _logger.LogInformation("Asignaciones obtenidas: {Count}", assignments.Count);
                foreach (var assignment in assignments.Take(3))
                {
                    _logger.LogInformation("Assignment: Id={Id}, Empresa={Empresa}, Nombre={Nombre}, Apellido={Apellido}", 
                        assignment.Id, assignment.Empresa, assignment.Nombre, assignment.Apellido);
                }

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
                // Obtener todos los usuarios de nómina que tengan email
                var nominaUsers = await _context.NominaUsuarios
                    .Where(u => !string.IsNullOrEmpty(u.Email))
                    .Select(u => new
                    {
                        NominaId = u.Id,
                        u.Nombre,
                        u.Apellido,
                        u.Email,
                        u.Departamento,
                        u.Rut
                    })
                    .ToListAsync();

                _logger.LogInformation("Usuarios de nómina encontrados: {Count}", nominaUsers.Count);
                
                // Obtener todos los AuthUsers activos
                var authUsers = await _context.AuthUsers
                    .Where(au => au.IsActive)
                    .Select(au => new
                    {
                        au.Id,
                        au.Username,
                        au.Role
                    })
                    .ToListAsync();

                _logger.LogInformation("=== RESUMEN ===");
                _logger.LogInformation("Usuarios de nómina: {Count}", nominaUsers.Count);
                _logger.LogInformation("AuthUsers activos: {Count}", authUsers.Count);
                
                // Mostrar algunos ejemplos
                _logger.LogInformation("=== EJEMPLOS NÓMINA ===");
                foreach (var nu in nominaUsers.Take(3))
                {
                    _logger.LogInformation("Nómina - Email: '{Email}', Nombre: {Nombre}", nu.Email, nu.Nombre);
                }
                
                _logger.LogInformation("=== EJEMPLOS AUTHUSERS ===");
                foreach (var au in authUsers.Take(3))
                {
                    _logger.LogInformation("AuthUser - Username: '{Username}', Role: {Role}", au.Username, au.Role);
                }

                // Combinar los datos - usar solo NominaId como ID principal para evitar conflictos
                var users = nominaUsers.Select(nu => 
                {
                    var authUser = authUsers.FirstOrDefault(au => au.Username == nu.Email);
                    
                    // Logging detallado para debugging
                    if (authUser == null)
                    {
                        _logger.LogWarning("NO MATCH - Email nómina: '{Email}' no tiene AuthUser correspondiente", nu.Email);
                        _logger.LogWarning("AuthUsers disponibles: {AuthUsernames}", string.Join(", ", authUsers.Select(au => au.Username)));
                    }
                    else
                    {
                        _logger.LogInformation("MATCH ENCONTRADO - Email nómina: '{Email}' -> AuthUser ID: {AuthUserId}", nu.Email, authUser.Id);
                    }
                    
                    return new
                    {
                        Id = nu.NominaId, // Usar siempre NominaId como ID principal
                        authUserId = authUser?.Id, // ID del AuthUser separado (minúscula)
                        nominaId = nu.NominaId,
                        nombre = nu.Nombre,
                        apellido = nu.Apellido,
                        email = nu.Email,
                        departamento = nu.Departamento,
                        cargo = "Empleado",
                        rut = nu.Rut,
                        role = authUser?.Role ?? "usuario",
                        hasAuthUser = authUser != null // minúscula para consistencia
                    };
                })
                .OrderBy(u => u.nombre)
                .ThenBy(u => u.apellido)
                .ToList();

                var usersWithAuth = users.Count(u => u.hasAuthUser);
                var usersWithoutAuth = users.Count - usersWithAuth;
                
                _logger.LogInformation("=== RESULTADO FINAL ===");
                _logger.LogInformation("Total usuarios: {Count}", users.Count);
                _logger.LogInformation("Con AuthUser: {Count}", usersWithAuth);
                _logger.LogInformation("Sin AuthUser: {Count}", usersWithoutAuth);

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
                _logger.LogInformation("Iniciando creación de asignación de rol. AuthUserId: {AuthUserId}, Departamento: {Departamento}, Rol: {Rol}", 
                    request.UserId, request.Departamento, request.Rol);

                // Buscar el AuthUser directamente por ID (el frontend envía authUserId)
                var authUser = await _context.AuthUsers
                    .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive);

                if (authUser == null)
                {
                    _logger.LogWarning("Usuario no tiene cuenta de acceso activa. AuthUserId: {AuthUserId}", request.UserId);
                    return BadRequest("Usuario no tiene cuenta de acceso activa");
                }

                // Obtener el usuario de nómina por email para validación
                var nominaUser = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Email == authUser.Username);

                if (nominaUser == null)
                {
                    _logger.LogWarning("Usuario no encontrado en nómina. Email: {Email}", authUser.Username);
                    return BadRequest("Usuario no encontrado en nómina");
                }

                _logger.LogInformation("AuthUser encontrado. Id: {AuthUserId}, Username: {Username}", authUser.Id, authUser.Username);
                _logger.LogInformation("Usuario encontrado en nómina: {Email}, Departamento: {Departamento}", nominaUser.Email, nominaUser.Departamento);

                // Verificar que no existe ya una asignación activa para este rol, departamento y empresa
                _logger.LogInformation("Verificando asignaciones existentes...");
                var existingAssignment = await _context.PazYSalvoRoleAssignments
                    .AnyAsync(a => a.Departamento == request.Departamento && 
                                  a.Rol == request.Rol && 
                                  a.Empresa == nominaUser.Empresa &&
                                  a.IsActive);

                _logger.LogInformation("Asignaciones existentes encontradas: {Exists}", existingAssignment);

                if (existingAssignment)
                {
                    _logger.LogWarning("Ya existe una asignación activa para este rol, departamento y empresa");
                    return BadRequest($"Ya existe una asignación activa para el rol {request.Rol} en el departamento {request.Departamento} para la empresa {nominaUser.Empresa}");
                }

                // Crear la asignación de subrol (no cambiar el rol principal)
                _logger.LogInformation("Creando nueva asignación de subrol...");
                var newAssignment = new PazYSalvoRoleAssignment
                {
                    Departamento = request.Departamento,
                    Rol = request.Rol,
                    Empresa = nominaUser.Empresa, // Asignar empresa del usuario de nómina
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
                    // Si ya existe, crear la asignación de subrol de JefeInmediato
                    var existingAssignment = await _context.PazYSalvoRoleAssignments
                        .FirstOrDefaultAsync(ra => ra.UserId == authUser.Id && ra.Rol == "JefeInmediato" && ra.IsActive);
                    
                    if (existingAssignment == null)
                    {
                        var jefeAssignment = new PazYSalvoRoleAssignment
                        {
                            UserId = authUser.Id,
                            Departamento = usuario.Departamento ?? "Sin departamento",
                            Rol = "JefeInmediato",
                            IsActive = true,
                            CreatedAt = DateTime.Now
                        };
                        
                        _context.PazYSalvoRoleAssignments.Add(jefeAssignment);
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation("Subrol JefeInmediato asignado al usuario existente {UserId}", authUser.Id);
                    }
                    
                    return Ok(new { message = "Usuario ya existe, subrol JefeInmediato asignado", userId = authUser.Id });
                }

                // Crear nuevo AuthUser con contraseña "admin"
                var defaultPassword = "admin";
                var passwordHash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(defaultPassword));
                var passwordSalt = new byte[32]; // Salt aleatorio
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(passwordSalt);
                }
                
                var newAuthUser = new AuthUser
                {
                    Username = usuario.Email,
                    PasswordHash = passwordHash, // Contraseña "admin"
                    PasswordSalt = passwordSalt,
                    Role = "usuario", // Rol principal por defecto, no subrol
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.AuthUsers.Add(newAuthUser);
                await _context.SaveChangesAsync();

                // Crear asignación de subrol JefeInmediato
                var newAssignment = new PazYSalvoRoleAssignment
                {
                    UserId = newAuthUser.Id,
                    Departamento = usuario.Departamento ?? "Sin departamento",
                    Rol = "JefeInmediato",
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };
                
                _context.PazYSalvoRoleAssignments.Add(newAssignment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Jefe directo creado con subrol JefeInmediato. UserId: {UserId}, Password: admin", newAuthUser.Id);

                return Ok(new { message = "Jefe directo creado exitosamente con subrol JefeInmediato. Contraseña: admin", userId = newAuthUser.Id });
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
                
                var delegations = await _context.PazYSalvoDelegations
                    .Where(d => d.UsuarioPrincipalId == currentUserId && d.IsActive)
                    .Include(d => d.UsuarioDelegado)
                    .Select(d => new
                    {
                        Id = d.Id,
                        UsuarioDelegado = new
                        {
                            Id = d.UsuarioDelegado.Id,
                            Nombre = d.UsuarioDelegado.Nombre,
                            Apellido = d.UsuarioDelegado.Apellido,
                            Email = d.UsuarioDelegado.Email,
                            Cargo = "Usuario", // Valor por defecto
                            Departamento = d.UsuarioDelegado.Departamento ?? "Sin departamento"
                        },
                        SubRole = d.SubRole,
                        Motivo = d.Motivo,
                        FechaInicio = d.FechaInicio,
                        FechaFin = d.FechaFin,
                        IsActive = d.IsActive,
                        CreatedAt = d.CreatedAt
                    })
                    .ToListAsync();
                
                return Ok(delegations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener delegaciones del usuario");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Crea una nueva delegación
        /// </summary>
        [HttpPost("delegations")]
        [Authorize]
        public async Task<IActionResult> CreateDelegation([FromBody] CreateDelegationRequest request)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Validar que el usuario delegado existe
                var usuarioDelegado = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Id == request.UsuarioDelegadoId && u.Email != null && u.Email != "");

                if (usuarioDelegado == null)
                {
                    return BadRequest("El usuario seleccionado no existe o no está activo");
                }

                // Validar que no se está delegando a sí mismo
                var currentUser = await _context.NominaUsuarios
                    .FirstOrDefaultAsync(u => u.Id == currentUserId);

                if (currentUser == null)
                {
                    return BadRequest("Usuario actual no encontrado");
                }

                if (request.UsuarioDelegadoId == currentUserId)
                {
                    return BadRequest("No puedes delegar a ti mismo");
                }

                // Validar fecha fin
                if (request.FechaFin <= DateTime.Now)
                {
                    return BadRequest("La fecha fin debe ser posterior a la fecha actual");
                }

                // Verificar que no hay una delegación activa para el mismo subrol
                var existingDelegation = await _context.PazYSalvoDelegations
                    .FirstOrDefaultAsync(d => d.UsuarioPrincipalId == currentUserId && 
                                            d.SubRole == request.SubRole && 
                                            d.IsActive && 
                                            d.FechaFin >= DateTime.Now);

                if (existingDelegation != null)
                {
                    // Revocar la delegación anterior
                    existingDelegation.IsActive = false;
                    existingDelegation.UpdatedAt = DateTime.Now;
                }

                // Crear nueva delegación
                var delegation = new PazYSalvoDelegation
                {
                    UsuarioPrincipalId = currentUserId,
                    UsuarioDelegadoId = request.UsuarioDelegadoId,
                    SubRole = request.SubRole,
                    Motivo = request.Motivo,
                    FechaInicio = DateTime.Now,
                    FechaFin = request.FechaFin,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.PazYSalvoDelegations.Add(delegation);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Delegación creada exitosamente", delegationId = delegation.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear delegación");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        /// <summary>
        /// Revoca una delegación
        /// </summary>
        [HttpDelete("delegations/{delegationId}")]
        [Authorize]
        public async Task<IActionResult> RevokeDelegation(int delegationId)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var delegation = await _context.PazYSalvoDelegations
                    .FirstOrDefaultAsync(d => d.Id == delegationId && d.UsuarioPrincipalId == currentUserId);

                if (delegation == null)
                {
                    return NotFound("Delegación no encontrada");
                }

                delegation.IsActive = false;
                delegation.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Delegación revocada exitosamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al revocar delegación");
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

        /// <summary>
        /// Obtiene usuarios de nómina disponibles para delegación
        /// </summary>
        [HttpGet("delegation-users")]
        [Authorize]
        public async Task<IActionResult> GetDelegationUsers()
        {
            try
            {
                var users = await _context.NominaUsuarios
                    .Where(u => u.Email != null && u.Email != "")
                    .OrderBy(u => u.Nombre)
                    .ThenBy(u => u.Apellido)
                    .Select(u => new
                    {
                        Id = u.Id,
                        Nombre = u.Nombre,
                        Apellido = u.Apellido,
                        Email = u.Email,
                        Cargo = "Usuario", // Valor por defecto ya que no existe en el modelo
                        Departamento = u.Departamento ?? "Sin departamento",
                        Empresa = u.Empresa ?? "Sin empresa",
                        DisplayName = $"{u.Nombre} {u.Apellido} ({u.Email})"
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios para delegación");
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
        public string? Empresa { get; set; }
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

    public class CreateDelegationRequest
    {
        public int UsuarioDelegadoId { get; set; }
        public string SubRole { get; set; } = string.Empty;
        public string Motivo { get; set; } = string.Empty;
        public DateTime FechaFin { get; set; }
    }
}
