using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using System.Linq;
using System.Threading.Tasks;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificacionesController : ControllerBase
    {
        private readonly PortalTiContext _context;
        public NotificacionesController(PortalTiContext context)
        {
            _context = context;
        }

        // GET: api/notificaciones
        [HttpGet]
        public async Task<IActionResult> GetNotificaciones()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");
            var notificaciones = await _context.Notificaciones
                .Where(n => n.UsuarioId == userId)
                .OrderByDescending(n => n.Fecha)
                .Take(50)
                .ToListAsync();
            return Ok(notificaciones);
        }

        // PUT: api/notificaciones/{id}/leida
        [HttpPut("{id}/leida")]
        public async Task<IActionResult> MarcarComoLeida(int id)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = int.Parse(userIdClaim?.Value ?? "0");
            var notificacion = await _context.Notificaciones.FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == userId);
            if (notificacion == null) return NotFound();
            notificacion.Leida = true;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
