using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace PortalTi.Api.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;
        private static readonly ConcurrentDictionary<int, DateTime> _userLastSeen = new ConcurrentDictionary<int, DateTime>();

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"ChatHub: Usuario conectándose - ConnectionId: {Context.ConnectionId}");
            
            var userId = GetUserIdFromContext();
            
            if (userId.HasValue)
            {
                _logger.LogInformation($"ChatHub: Usuario {userId} conectado - ConnectionId: {Context.ConnectionId}");
                
                // Actualizar estado de conexión
                _userLastSeen.AddOrUpdate(userId.Value, DateTime.Now, (key, oldValue) => DateTime.Now);
                
                // Agregar el usuario a un grupo específico para su ID
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                // También agregar a grupos por rol si es necesario
                var role = GetUserRoleFromContext();
                
                if (!string.IsNullOrEmpty(role))
                {
                    _logger.LogInformation($"ChatHub: Usuario {userId} agregado al grupo role_{role}");
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
                }

                // Notificar a otros usuarios sobre el estado de conexión
                await Clients.OthersInGroup($"role_{role}").SendAsync("UserStatusChanged", userId.Value, "online");
            }
            else
            {
                _logger.LogWarning($"ChatHub: Usuario sin ID válido conectándose - ConnectionId: {Context.ConnectionId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserIdFromContext();
            if (userId.HasValue)
            {
                _logger.LogInformation($"ChatHub: Usuario {userId} desconectándose - ConnectionId: {Context.ConnectionId}");
                
                // Actualizar estado de desconexión
                _userLastSeen.AddOrUpdate(userId.Value, DateTime.Now, (key, oldValue) => DateTime.Now);
                
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                var role = GetUserRoleFromContext();
                if (!string.IsNullOrEmpty(role))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"role_{role}");
                    
                    // Notificar a otros usuarios sobre el estado de desconexión
                    await Clients.OthersInGroup($"role_{role}").SendAsync("UserStatusChanged", userId.Value, "offline");
                }
            }
            else
            {
                _logger.LogWarning($"ChatHub: Usuario desconectándose sin ID válido - ConnectionId: {Context.ConnectionId}");
            }

            if (exception != null)
            {
                _logger.LogError(exception, $"ChatHub: Error en desconexión - ConnectionId: {Context.ConnectionId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        private int? GetUserIdFromContext()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
                return userId;
            return null;
        }

        private string? GetUserRoleFromContext()
        {
            return Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        }

        // Método para obtener el estado de conexión de un usuario
        public static bool IsUserOnline(int userId)
        {
            if (_userLastSeen.TryGetValue(userId, out DateTime lastSeen))
            {
                // Considerar offline si no ha estado activo en los últimos 5 minutos
                return DateTime.Now.Subtract(lastSeen).TotalMinutes < 5;
            }
            return false;
        }

        // Método para obtener la última vez que se vio a un usuario
        public static DateTime? GetUserLastSeen(int userId)
        {
            _userLastSeen.TryGetValue(userId, out DateTime lastSeen);
            return lastSeen;
        }
    }
}

