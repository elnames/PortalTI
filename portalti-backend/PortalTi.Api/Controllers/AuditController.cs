using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PortalTi.Api.Services;
using PortalTi.Api.Filters;

namespace PortalTi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "CanViewReports")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;
        private readonly ILogger<AuditController> _logger;

        public AuditController(IAuditService auditService, ILogger<AuditController> logger)
        {
            _auditService = auditService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetAuditLogs(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? action = null,
            [FromQuery] string? resourceType = null,
            [FromQuery] int? userId = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 100)
        {
            try
            {
                // Validar parámetros de paginación
                if (skip < 0 || take <= 0 || take > 1000)
                {
                    return BadRequest("Parámetros de paginación inválidos. skip >= 0, 0 < take <= 1000");
                }

                var logs = await _auditService.GetAuditLogsAsync(fromDate, toDate, action, resourceType, userId, skip, take);
                var totalCount = await _auditService.GetAuditLogsCountAsync(fromDate, toDate, action, resourceType, userId);

                var result = logs.Select(log => new
                {
                    log.Id,
                    log.Action,
                    log.ResourceType,
                    log.ResourceId,
                    log.IpAddress,
                    log.UserAgent,
                    log.Timestamp,
                    log.DataJson,
                    User = new
                    {
                        log.User.Id,
                        log.User.Username,
                        log.User.Role
                    }
                });

                return Ok(new
                {
                    data = result,
                    pagination = new
                    {
                        skip,
                        take,
                        total = totalCount,
                        hasMore = skip + take < totalCount
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener logs de auditoría");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportAuditLogsCsv(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? action = null,
            [FromQuery] string? resourceType = null,
            [FromQuery] int? userId = null)
        {
            try
            {
                var logs = await _auditService.GetAuditLogsAsync(fromDate, toDate, action, resourceType, userId, 0, 10000);

                var csvContent = "Id,Action,ResourceType,ResourceId,IpAddress,UserAgent,Timestamp,Username,Role\n";
                
                foreach (var log in logs)
                {
                    var line = $"{log.Id}," +
                              $"\"{log.Action}\"," +
                              $"\"{log.ResourceType}\"," +
                              $"{log.ResourceId}," +
                              $"\"{log.IpAddress}\"," +
                              $"\"{log.UserAgent}\"," +
                              $"\"{log.Timestamp:yyyy-MM-dd HH:mm:ss}\"," +
                              $"\"{log.User?.Username}\"," +
                              $"\"{log.User?.Role}\"\n";
                    csvContent += line;
                }

                var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
                var fileName = $"audit_logs_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al exportar logs de auditoría a CSV");
                return StatusCode(500, "Error interno del servidor");
            }
        }

        [HttpGet("actions")]
        public async Task<ActionResult<object>> GetAvailableActions()
        {
            try
            {
                // Obtener acciones únicas disponibles
                var logs = await _auditService.GetAuditLogsAsync(take: 10000);
                var actions = logs.Select(l => l.Action).Distinct().OrderBy(a => a).ToList();
                var resourceTypes = logs.Select(l => l.ResourceType).Distinct().OrderBy(rt => rt).ToList();

                return Ok(new
                {
                    actions,
                    resourceTypes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener acciones disponibles");
                return StatusCode(500, "Error interno del servidor");
            }
        }
    }
}

