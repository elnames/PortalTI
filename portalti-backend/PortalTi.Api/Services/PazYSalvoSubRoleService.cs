using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;

namespace PortalTi.Api.Services
{
    public interface IPazYSalvoSubRoleService
    {
        Task<List<PazYSalvoSubRole>> GetActiveSubRolesAsync();
        Task<PazYSalvoSubRole?> GetSubRoleByNameAsync(string nombre);
        Task<bool> CanUserDelegateAsync(int userId, string subRole);
        Task<List<PazYSalvoDelegation>> GetActiveDelegationsAsync(int userId);
        Task<bool> CreateDelegationAsync(int usuarioPrincipalId, int usuarioDelegadoId, string subRole, string motivo, DateTime fechaFin);
        Task<bool> RevokeDelegationAsync(int delegationId);
        Task<List<string>> GetUserEffectiveSubRolesAsync(int userId);
    }

    public class PazYSalvoSubRoleService : IPazYSalvoSubRoleService
    {
        private readonly PortalTiContext _context;
        private readonly ILogger<PazYSalvoSubRoleService> _logger;

        public PazYSalvoSubRoleService(PortalTiContext context, ILogger<PazYSalvoSubRoleService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<PazYSalvoSubRole>> GetActiveSubRolesAsync()
        {
            return await _context.PazYSalvoSubRoles
                .Where(sr => sr.IsActive)
                .OrderBy(sr => sr.Orden)
                .ToListAsync();
        }

        public async Task<PazYSalvoSubRole?> GetSubRoleByNameAsync(string nombre)
        {
            return await _context.PazYSalvoSubRoles
                .FirstOrDefaultAsync(sr => sr.Nombre == nombre && sr.IsActive);
        }

        public async Task<bool> CanUserDelegateAsync(int userId, string subRole)
        {
            // Verificar si el usuario tiene el subrol y si permite delegación
            var subRoleEntity = await GetSubRoleByNameAsync(subRole);
            if (subRoleEntity == null || !subRoleEntity.PermiteDelegacion)
                return false;

            // Verificar si el usuario tiene una asignación activa para este subrol
            var hasAssignment = await _context.Database
                .SqlQueryRaw<bool>(@"
                    SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
                    FROM PazYSalvoRoleAssignments pra
                    INNER JOIN AuthUsers au ON pra.UserId = au.Id
                    WHERE au.Id = {0} AND pra.Rol = {1} AND pra.IsActive = 1 AND au.IsActive = 1",
                    userId, subRole)
                .FirstOrDefaultAsync();

            return hasAssignment;
        }

        public async Task<List<PazYSalvoDelegation>> GetActiveDelegationsAsync(int userId)
        {
            var now = DateTime.Now;
            return await _context.PazYSalvoDelegations
                .Where(d => d.UsuarioPrincipalId == userId && 
                           d.IsActive && 
                           d.FechaInicio <= now && 
                           d.FechaFin >= now)
                .Include(d => d.UsuarioDelegado)
                .ToListAsync();
        }

        public async Task<bool> CreateDelegationAsync(int usuarioPrincipalId, int usuarioDelegadoId, string subRole, string motivo, DateTime fechaFin)
        {
            try
            {
                // Verificar que el usuario principal puede delegar este subrol
                if (!await CanUserDelegateAsync(usuarioPrincipalId, subRole))
                    return false;

                // Verificar que no hay una delegación activa para el mismo subrol
                var existingDelegation = await _context.PazYSalvoDelegations
                    .FirstOrDefaultAsync(d => d.UsuarioPrincipalId == usuarioPrincipalId && 
                                            d.SubRole == subRole && 
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
                    UsuarioPrincipalId = usuarioPrincipalId,
                    UsuarioDelegadoId = usuarioDelegadoId,
                    SubRole = subRole,
                    Motivo = motivo,
                    FechaInicio = DateTime.Now,
                    FechaFin = fechaFin,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.PazYSalvoDelegations.Add(delegation);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear delegación para usuario {UserId} y subrol {SubRole}", usuarioPrincipalId, subRole);
                return false;
            }
        }

        public async Task<bool> RevokeDelegationAsync(int delegationId)
        {
            try
            {
                var delegation = await _context.PazYSalvoDelegations
                    .FirstOrDefaultAsync(d => d.Id == delegationId);

                if (delegation == null)
                    return false;

                delegation.IsActive = false;
                delegation.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al revocar delegación {DelegationId}", delegationId);
                return false;
            }
        }

        public async Task<List<string>> GetUserEffectiveSubRolesAsync(int userId)
        {
            var effectiveRoles = new List<string>();

            // Obtener subroles directos del usuario
            var directRoles = await _context.Database
                .SqlQueryRaw<string>(@"
                    SELECT pra.Rol
                    FROM PazYSalvoRoleAssignments pra
                    INNER JOIN AuthUsers au ON pra.UserId = au.Id
                    WHERE au.Id = {0} AND pra.IsActive = 1 AND au.IsActive = 1",
                    userId)
                .ToListAsync();

            effectiveRoles.AddRange(directRoles);

            // Obtener subroles delegados
            var now = DateTime.Now;
            var delegatedRoles = await _context.PazYSalvoDelegations
                .Where(d => d.UsuarioDelegadoId == userId && 
                           d.IsActive && 
                           d.FechaInicio <= now && 
                           d.FechaFin >= now)
                .Select(d => d.SubRole)
                .ToListAsync();

            effectiveRoles.AddRange(delegatedRoles);

            return effectiveRoles.Distinct().ToList();
        }
    }
}
