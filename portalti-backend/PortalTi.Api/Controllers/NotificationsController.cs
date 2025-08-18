using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Models;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using PortalTi.Api.Hubs;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationsService _notificationsService;

        public NotificationsController(INotificationsService notificationsService)
        {
            _notificationsService = notificationsService;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(
            [FromQuery] bool? isRead = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var notifications = await _notificationsService.GetForUserAsync(userId.Value, isRead, skip, take);
            return Ok(notifications);
        }

        // POST: api/notifications
        [HttpPost]
        [AuditAction("crear_notificacion", "Notificacion", true, true)]
        public async Task<ActionResult<NotificationDto>> CreateNotification(CreateNotificationDto dto)
        {
            var notificationId = await _notificationsService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetNotifications), new { id = notificationId }, dto);
        }

        // POST: api/notifications/role/{role}
        [HttpPost("role/{role}")]
        [Authorize(Policy = "CanDeleteNotifications")]
        [AuditAction("crear_notificacion_rol", "Notificacion", true, true)]
        public async Task<ActionResult<object>> CreateNotificationForRole(string role, CreateNotificationDto dto)
        {
            var count = await _notificationsService.CreateForRoleAsync(role, dto);
            return Ok(new { 
                message = $"Notificación creada para {count} usuarios con rol '{role}'",
                count = count
            });
        }

        // POST: api/notifications/admins
        [HttpPost("admins")]
        [Authorize(Policy = "CanDeleteNotifications")]
        [AuditAction("crear_notificacion_admins", "Notificacion", true, true)]
        public async Task<ActionResult<object>> CreateNotificationForAdmins(CreateNotificationDto dto)
        {
            var count = await _notificationsService.CreateForAdminsAsync(dto);
            return Ok(new { 
                message = $"Notificación creada para {count} administradores",
                count = count
            });
        }

        // POST: api/notifications/read
        [HttpPost("read")]
        [AuditAction("marcar_notificacion_leida", "Notificacion", true, true)]
        public async Task<IActionResult> MarkAsRead(MarkReadDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (dto.Ids == null || !dto.Ids.Any())
                return BadRequest("Se requieren IDs de notificaciones");

            await _notificationsService.MarkReadAsync(userId.Value, dto.Ids);
            return NoContent();
        }

        // DELETE: api/notifications/{id}
        [HttpDelete("{id}")]
        [AuditAction("eliminar_notificacion", "Notificacion", true, true)]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var deleted = await _notificationsService.DeleteAsync(userId.Value, id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        // DELETE: api/notifications (borrar todas)
        [HttpDelete]
        [AuditAction("eliminar_todas_notificaciones", "Notificacion", true, true)]
        public async Task<IActionResult> DeleteAll()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var count = await _notificationsService.DeleteAllAsync(userId.Value);
            return Ok(new { deleted = count });
        }

        // GET: api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var count = await _notificationsService.GetUnreadCountAsync(userId.Value);
            return Ok(count);
        }

        // POST: api/notifications/test
        [HttpPost("test")]
        [Authorize]
        [AuditAction("test_notificacion", "Notificacion", true, true)]
        public async Task<ActionResult<object>> TestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                    return Unauthorized();

                var count = 0;
                
                switch (request.Type)
                {
                    case "direct":
                        var targetUserId = request.UserId ?? currentUserId.Value;
                        await _notificationsService.CreateAsync(new CreateNotificationDto
                        {
                            UserId = targetUserId,
                            Tipo = "test",
                            Titulo = "Notificación de prueba directa",
                            Mensaje = request.Message ?? $"Esta es una notificación de prueba enviada directamente al usuario {targetUserId}",
                            RefTipo = "Test",
                            RefId = 1,
                            Ruta = "/test"
                        });
                        count = 1;
                        break;
                        
                    case "admins":
                        count = await _notificationsService.CreateForAdminsAsync(new CreateNotificationDto
                        {
                            UserId = 0,
                            Tipo = "test",
                            Titulo = "Notificación de prueba para admins",
                            Mensaje = request.Message ?? "Esta es una notificación de prueba para todos los administradores",
                            RefTipo = "Test",
                            RefId = 1,
                            Ruta = "/test"
                        });
                        break;
                        
                    case "role":
                        count = await _notificationsService.CreateForRoleAsync(request.Role ?? "admin", new CreateNotificationDto
                        {
                            UserId = 0,
                            Tipo = "test",
                            Titulo = $"Notificación de prueba para rol {request.Role}",
                            Mensaje = request.Message ?? $"Esta es una notificación de prueba para usuarios con rol {request.Role}",
                            RefTipo = "Test",
                            RefId = 1,
                            Ruta = "/test"
                        });
                        break;
                        
                    default:
                        return BadRequest("Tipo de notificación no válido");
                }

                return Ok(new { 
                    message = $"Notificación de prueba enviada. {count} usuarios notificados.",
                    count = count,
                    type = request.Type
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("test-rechazo-acta")]
        public async Task<IActionResult> TestRechazoActa([FromBody] TestRechazoActaRequest request)
        {
            try
            {
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(currentUserId, out int adminId))
                {
                    return Unauthorized("Usuario no autenticado");
                }

                Console.WriteLine($"DEBUG: TestRechazoActa - UsuarioId objetivo: {request.UserId}");
                Console.WriteLine($"DEBUG: TestRechazoActa - Comentarios: {request.Comentarios}");

                // Simular exactamente lo que hace AprobarActa
                var notificationId = await _notificationsService.CreateAsync(new CreateNotificationDto
                {
                    UserId = request.UserId,
                    Tipo = "acta",
                    Titulo = "Acta rechazada",
                    Mensaje = $"Tu acta ha sido rechazada: {request.Comentarios}",
                    RefTipo = "Acta",
                    RefId = request.ActaId,
                    Ruta = $"/actas/{request.ActaId}"
                });

                Console.WriteLine($"DEBUG: TestRechazoActa - Notificación creada exitosamente - ID: {notificationId}");

                return Ok(new { 
                    message = "Notificación de rechazo de acta enviada exitosamente",
                    notificationId = notificationId,
                    userId = request.UserId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: TestRechazoActa - Error: {ex.Message}");
                Console.WriteLine($"ERROR: TestRechazoActa - Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("debug-connections")]
        [Authorize(Policy = "CanDeleteNotifications")]
        public async Task<IActionResult> DebugConnections()
        {
            try
            {
                // Obtener información de conexiones activas
                var hubContext = HttpContext.RequestServices.GetRequiredService<IHubContext<NotificationsHub>>();
                
                // Esta es una implementación simplificada - en producción necesitarías un servicio de tracking
                var result = new
                {
                    message = "Información de conexiones SignalR",
                    timestamp = DateTime.Now,
                    note = "Esta información es limitada. Para debugging completo, revisa los logs del backend."
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("test-usuario-especifico")]
        [Authorize(Policy = "CanDeleteNotifications")]
        public async Task<IActionResult> TestUsuarioEspecifico([FromBody] TestUsuarioEspecificoRequest request)
        {
            try
            {
                Console.WriteLine($"DEBUG: TestUsuarioEspecifico - Probando usuario {request.UserId}");
                Console.WriteLine($"DEBUG: TestUsuarioEspecifico - Mensaje: {request.Mensaje}");
                
                var notificationId = await _notificationsService.CreateAsync(new CreateNotificationDto
                {
                    UserId = request.UserId,
                    Tipo = "test",
                    Titulo = "Test Usuario Específico",
                    Mensaje = request.Mensaje,
                    RefTipo = "Test",
                    RefId = request.UserId,
                    Ruta = "/test"
                });
                
                Console.WriteLine($"DEBUG: TestUsuarioEspecifico - Notificación creada - ID: {notificationId}");
                
                return Ok(new { 
                    message = $"Test enviado al usuario {request.UserId}",
                    notificationId = notificationId,
                    userId = request.UserId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: TestUsuarioEspecifico - Error: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class TestNotificationRequest
        {
            public string Type { get; set; } = "direct"; // "direct", "admins", "role"
            public string? Role { get; set; }
            public string? Message { get; set; }
            public int? UserId { get; set; } // Para enviar a un usuario específico
        }

        public class TestRechazoActaRequest
        {
            public int UserId { get; set; }
            public int ActaId { get; set; }
            public string Comentarios { get; set; } = "Prueba de rechazo automático";
        }

        public class TestUsuarioEspecificoRequest
        {
            public int UserId { get; set; }
            public string Mensaje { get; set; } = "Test de usuario específico";
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
                return userId;
            return null;
        }
    }
}
