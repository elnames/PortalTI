using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using System.Security.Claims;

namespace PortalTi.Api.Handlers
{
    public class RRHHOrAdminWithSubrolesHandler : AuthorizationHandler<RRHHOrAdminWithSubrolesRequirement>
    {
        private readonly PortalTiContext _context;

        public RRHHOrAdminWithSubrolesHandler(PortalTiContext context)
        {
            _context = context;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            RRHHOrAdminWithSubrolesRequirement requirement)
        {
            // Verificar si el usuario está autenticado
            if (!context.User.Identity?.IsAuthenticated == true)
            {
                return;
            }

            // Obtener el ID del usuario
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return;
            }

            // Verificar rol principal (admin o rrhh)
            var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "admin" || userRole == "rrhh")
            {
                context.Succeed(requirement);
                return;
            }

            // Si no tiene rol principal, verificar subroles de RRHH
            var hasRRHHSubrole = await _context.PazYSalvoRoleAssignments
                .AnyAsync(p => p.UserId == userId && p.Rol == "RRHH" && p.IsActive);

            if (hasRRHHSubrole)
            {
                context.Succeed(requirement);
            }
        }
    }

    public class RRHHOrAdminWithSubrolesRequirement : IAuthorizationRequirement
    {
    }
}
