using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace PortalTi.Api.Hubs
{
    public class NotificationsHub : Hub
    {
        private readonly ILogger<NotificationsHub> _logger;

        public NotificationsHub(ILogger<NotificationsHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"SignalR: Usuario conectándose - ConnectionId: {Context.ConnectionId}");
            Console.WriteLine($"DEBUG: SignalR: Usuario conectándose - ConnectionId: {Context.ConnectionId}");
            
            // Debug: verificar si hay usuario autenticado
            Console.WriteLine($"DEBUG: SignalR: Usuario autenticado: {Context.User?.Identity?.IsAuthenticated}");
            Console.WriteLine($"DEBUG: SignalR: Claims count: {Context.User?.Claims?.Count() ?? 0}");
            
            var userId = GetUserIdFromContext();
            Console.WriteLine($"DEBUG: SignalR: UserId obtenido: {userId}");
            
            if (userId.HasValue)
            {
                _logger.LogInformation($"SignalR: Usuario {userId} conectado - ConnectionId: {Context.ConnectionId}");
                Console.WriteLine($"DEBUG: SignalR: Usuario {userId} conectado - ConnectionId: {Context.ConnectionId}");
                
                // Agregar el usuario a un grupo específico para su ID
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                Console.WriteLine($"DEBUG: SignalR: Usuario {userId} agregado al grupo user_{userId}");
                
                // También agregar a grupos por rol si es necesario
                var role = GetUserRoleFromContext();
                Console.WriteLine($"DEBUG: SignalR: Role obtenido: {role}");
                
                if (!string.IsNullOrEmpty(role))
                {
                    _logger.LogInformation($"SignalR: Usuario {userId} agregado al grupo role_{role}");
                    Console.WriteLine($"DEBUG: SignalR: Usuario {userId} agregado al grupo role_{role}");
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
                }
            }
            else
            {
                _logger.LogWarning($"SignalR: Usuario sin ID válido conectándose - ConnectionId: {Context.ConnectionId}");
                Console.WriteLine($"DEBUG: SignalR: Usuario sin ID válido conectándose - ConnectionId: {Context.ConnectionId}");
                
                // Debug: mostrar todos los claims disponibles
                if (Context.User?.Claims != null)
                {
                    Console.WriteLine($"DEBUG: Claims disponibles:");
                    foreach (var claim in Context.User.Claims)
                    {
                        Console.WriteLine($"DEBUG: - {claim.Type}: {claim.Value}");
                    }
                }
                else
                {
                    Console.WriteLine($"DEBUG: No hay claims disponibles");
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserIdFromContext();
            if (userId.HasValue)
            {
                _logger.LogInformation($"SignalR: Usuario {userId} desconectándose - ConnectionId: {Context.ConnectionId}");
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                
                var role = GetUserRoleFromContext();
                if (!string.IsNullOrEmpty(role))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"role_{role}");
                }
            }
            else
            {
                _logger.LogWarning($"SignalR: Usuario desconectándose sin ID válido - ConnectionId: {Context.ConnectionId}");
            }

            if (exception != null)
            {
                _logger.LogError(exception, $"SignalR: Error en desconexión - ConnectionId: {Context.ConnectionId}");
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
    }
}
