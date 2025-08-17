using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PortalTi.Api.Data;
using PortalTi.Api.Hubs;
using PortalTi.Api.Models;

namespace PortalTi.Api.Services
{
    public interface INotificationsService
    {
        Task<int> CreateAsync(CreateNotificationDto notification);
        Task<IEnumerable<NotificationDto>> GetForUserAsync(int userId, bool? isRead = null, int skip = 0, int take = 20);
        Task MarkReadAsync(int userId, int[] ids);
        Task<int> GetUnreadCountAsync(int userId);
        Task<bool> DeleteAsync(int userId, int notificationId);
        Task<int> DeleteAllAsync(int userId);
        Task SendToUserAsync(int userId, NotificationDto notification);
        Task SendToRoleAsync(string role, NotificationDto notification);
        Task<int> CreateForRoleAsync(string role, CreateNotificationDto notification);
        Task<int> CreateForAdminsAsync(CreateNotificationDto notification);
    }

    public class NotificationsService : INotificationsService
    {
        private readonly PortalTiContext _context;
        private readonly IHubContext<NotificationsHub> _hub;

        public NotificationsService(PortalTiContext context, IHubContext<NotificationsHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        public async Task<int> CreateAsync(CreateNotificationDto notification)
        {
            var entity = new Notificacion
            {
                UserId = notification.UserId,
                Tipo = notification.Tipo,
                Titulo = notification.Titulo,
                Mensaje = notification.Mensaje,
                RefTipo = notification.RefTipo,
                RefId = notification.RefId,
                Ruta = notification.Ruta,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notificaciones.Add(entity);
            await _context.SaveChangesAsync();

            // Enviar notificación en tiempo real solo si se persistió correctamente
            var dto = MapToDto(entity);
            await SendToUserAsync(notification.UserId, dto);

            return entity.Id;
        }

        public async Task<IEnumerable<NotificationDto>> GetForUserAsync(int userId, bool? isRead = null, int skip = 0, int take = 20)
        {
            var query = _context.Notificaciones
                .Where(n => n.UserId == userId);

            if (isRead.HasValue)
                query = query.Where(n => n.IsRead == isRead.Value);

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return notifications.Select(MapToDto);
        }

        public async Task MarkReadAsync(int userId, int[] ids)
        {
            var notifications = await _context.Notificaciones
                .Where(n => n.UserId == userId && ids.Contains(n.Id))
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notificaciones
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();
        }

        public async Task<bool> DeleteAsync(int userId, int notificationId)
        {
            var notification = await _context.Notificaciones
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            _context.Notificaciones.Remove(notification);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteAllAsync(int userId)
        {
            var toDelete = await _context.Notificaciones
                .Where(n => n.UserId == userId)
                .ToListAsync();
            if (toDelete.Count == 0) return 0;
            _context.Notificaciones.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
            return toDelete.Count;
        }

        public async Task SendToUserAsync(int userId, NotificationDto notification)
        {
            try
            {
                Console.WriteLine($"Enviando notificación a usuario {userId}: {notification.Titulo}");
                
                // Log específico para usuario 4
                if (userId == 4)
                {
                    Console.WriteLine($"DEBUG: Usuario 4 - Enviando notificación: {notification.Titulo}");
                    Console.WriteLine($"DEBUG: Usuario 4 - Mensaje: {notification.Mensaje}");
                }
                
                var groupName = $"user_{userId}";
                Console.WriteLine($"DEBUG: Enviando a grupo: {groupName}");
                Console.WriteLine($"DEBUG: Grupo objetivo: {groupName}");
                
                await _hub.Clients.Group(groupName).SendAsync("ReceiveNotification", notification);
                
                // Log específico para usuario 4
                if (userId == 4)
                {
                    Console.WriteLine($"DEBUG: Usuario 4 - Notificación enviada exitosamente a grupo {groupName}");
                }
                
                Console.WriteLine($"Notificación enviada exitosamente a usuario {userId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error enviando notificación a usuario {userId}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

        public async Task SendToRoleAsync(string role, NotificationDto notification)
        {
            try
            {
                Console.WriteLine($"DEBUG: SendToRoleAsync - Enviando a grupo role_{role}: {notification.Titulo}");
                await _hub.Clients.Group($"role_{role}")
                    .SendAsync("ReceiveNotification", notification);
                Console.WriteLine($"DEBUG: SendToRoleAsync - Notificación enviada exitosamente a grupo role_{role}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: Error enviando notificación a grupo role_{role}: {ex.Message}");
                Console.WriteLine($"ERROR: Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<int> CreateForRoleAsync(string role, CreateNotificationDto notification)
        {
            try
            {
                Console.WriteLine($"DEBUG: CreateForRoleAsync iniciado - Rol: {role}");
                
                // Obtener todos los usuarios con ese rol
                var usersWithRole = await _context.AuthUsers
                    .Where(u => u.Role.ToLower() == role.ToLower() && u.IsActive)
                    .ToListAsync();

                Console.WriteLine($"DEBUG: Usuarios encontrados con rol '{role}': {usersWithRole.Count}");
                
                foreach (var user in usersWithRole)
                {
                    Console.WriteLine($"DEBUG: Usuario con rol '{role}': ID={user.Id}, Username={user.Username}, IsActive={user.IsActive}");
                }

                var notificationIds = new List<int>();

                foreach (var user in usersWithRole)
                {
                    var entity = new Notificacion
                    {
                        UserId = user.Id,
                        Tipo = notification.Tipo,
                        Titulo = notification.Titulo,
                        Mensaje = notification.Mensaje,
                        RefTipo = notification.RefTipo,
                        RefId = notification.RefId,
                        Ruta = notification.Ruta,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notificaciones.Add(entity);
                    notificationIds.Add(entity.Id);
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"DEBUG: Notificaciones creadas en BD para rol '{role}': {notificationIds.Count}");

                // Enviar notificaciones en tiempo real a todos los usuarios del rol
                Console.WriteLine($"DEBUG: Enviando notificación en tiempo real a grupo role_{role}");
                await SendToRoleAsync(role, MapToDto(new Notificacion
                {
                    Id = notificationIds.FirstOrDefault(),
                    UserId = 0, // No específico
                    Tipo = notification.Tipo,
                    Titulo = notification.Titulo,
                    Mensaje = notification.Mensaje,
                    RefTipo = notification.RefTipo,
                    RefId = notification.RefId,
                    Ruta = notification.Ruta,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                }));

                Console.WriteLine($"DEBUG: CreateForRoleAsync completado - Rol: {role}, Notificaciones: {notificationIds.Count}");
                return notificationIds.Count;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: Error en CreateForRoleAsync para rol '{role}': {ex.Message}");
                Console.WriteLine($"ERROR: Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<int> CreateForAdminsAsync(CreateNotificationDto notification)
        {
            return await CreateForRoleAsync("admin", notification);
        }

        private static NotificationDto MapToDto(Notificacion entity)
        {
            return new NotificationDto
            {
                Id = entity.Id,
                UserId = entity.UserId,
                Tipo = entity.Tipo,
                Titulo = entity.Titulo,
                Mensaje = entity.Mensaje,
                RefTipo = entity.RefTipo,
                RefId = entity.RefId,
                Ruta = entity.Ruta,
                IsRead = entity.IsRead,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
