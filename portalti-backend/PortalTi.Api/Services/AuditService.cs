using PortalTi.Api.Data;
using PortalTi.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace PortalTi.Api.Services
{
    public interface IAuditService
    {
        Task LogActionAsync(int userId, string action, string resourceType, int? resourceId = null, object? data = null, string? ipAddress = null, string? userAgent = null);
        Task<IEnumerable<AuditLog>> GetAuditLogsAsync(DateTime? fromDate = null, DateTime? toDate = null, string? action = null, string? resourceType = null, int? userId = null, int skip = 0, int take = 100);
        Task<int> GetAuditLogsCountAsync(DateTime? fromDate = null, DateTime? toDate = null, string? action = null, string? resourceType = null, int? userId = null);
    }

    public class AuditService : IAuditService
    {
        private readonly PortalTiContext _context;
        private readonly ILogger<AuditService> _logger;

        public AuditService(PortalTiContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogActionAsync(int userId, string action, string resourceType, int? resourceId = null, object? data = null, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    UserId = userId,
                    Action = action,
                    ResourceType = resourceType,
                    ResourceId = resourceId,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.Now,
                    DataJson = data != null ? JsonSerializer.Serialize(data) : null
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar acción de auditoría: {Action} en {ResourceType}", action, resourceType);
                // No lanzar excepción para no interrumpir el flujo principal
            }
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsAsync(DateTime? fromDate = null, DateTime? toDate = null, string? action = null, string? resourceType = null, int? userId = null, int skip = 0, int take = 100)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(a => a.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.Timestamp <= toDate.Value);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (!string.IsNullOrEmpty(resourceType))
                query = query.Where(a => a.ResourceType == resourceType);

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            return await query
                .OrderByDescending(a => a.Timestamp)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetAuditLogsCountAsync(DateTime? fromDate = null, DateTime? toDate = null, string? action = null, string? resourceType = null, int? userId = null)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(a => a.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.Timestamp <= toDate.Value);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (!string.IsNullOrEmpty(resourceType))
                query = query.Where(a => a.ResourceType == resourceType);

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            return await query.CountAsync();
        }
    }
}
