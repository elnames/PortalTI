using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using PortalTi.Api.Services;
using System.Security.Claims;

namespace PortalTi.Api.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AuditActionAttribute : Attribute
    {
        public string Action { get; set; }
        public string ResourceType { get; set; }
        public bool LogRequestData { get; set; } = false;
        public bool LogResponseData { get; set; } = false;

        public AuditActionAttribute(string action, string resourceType, bool logRequestData = false, bool logResponseData = false)
        {
            Action = action;
            ResourceType = resourceType;
            LogRequestData = logRequestData;
            LogResponseData = logResponseData;
        }
    }

    public class AuditActionFilter : IAsyncActionFilter
    {
        private readonly IAuditService _auditService;
        private readonly ILogger<AuditActionFilter> _logger;

        public AuditActionFilter(IAuditService auditService, ILogger<AuditActionFilter> logger)
        {
            _auditService = auditService;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var auditAttribute = context.ActionDescriptor.EndpointMetadata
                .OfType<AuditActionAttribute>()
                .FirstOrDefault();

            if (auditAttribute == null)
            {
                await next();
                return;
            }

            var executedContext = await next();

            try
            {
                var userId = GetUserId(context.HttpContext.User);
                if (userId.HasValue)
                {
                    var ipAddress = GetIpAddress(context.HttpContext);
                    var userAgent = GetUserAgent(context.HttpContext);
                    var resourceId = GetResourceId(context, executedContext);
                    
                    var data = new
                    {
                        RequestData = auditAttribute.LogRequestData ? GetRequestData(context) : null,
                        ResponseData = auditAttribute.LogResponseData ? GetResponseData(executedContext) : null,
                        HttpMethod = context.HttpContext.Request.Method,
                        Path = context.HttpContext.Request.Path,
                        StatusCode = executedContext.Result is ObjectResult objResult ? objResult.StatusCode : 
                                   executedContext.Result is StatusCodeResult statusResult ? statusResult.StatusCode : 200
                    };

                    await _auditService.LogActionAsync(
                        userId.Value,
                        auditAttribute.Action,
                        auditAttribute.ResourceType,
                        resourceId,
                        data,
                        ipAddress,
                        userAgent
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en filtro de auditoría para {Action}", auditAttribute.Action);
                // No lanzar excepción para no interrumpir el flujo principal
            }
        }

        private int? GetUserId(ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                return userId;
            return null;
        }

        private string? GetIpAddress(HttpContext httpContext)
        {
            return httpContext.Connection.RemoteIpAddress?.ToString() ??
                   httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                   httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        }

        private string? GetUserAgent(HttpContext httpContext)
        {
            return httpContext.Request.Headers["User-Agent"].FirstOrDefault();
        }

        private int? GetResourceId(ActionExecutingContext context, ActionExecutedContext executedContext)
        {
            // Intentar obtener el ID del recurso de diferentes maneras
            if (context.RouteData.Values.TryGetValue("id", out var idValue))
            {
                if (int.TryParse(idValue?.ToString(), out int id))
                    return id;
            }

            if (context.RouteData.Values.TryGetValue("actaId", out var actaIdValue))
            {
                if (int.TryParse(actaIdValue?.ToString(), out int actaId))
                    return actaId;
            }

            if (context.RouteData.Values.TryGetValue("ticketId", out var ticketIdValue))
            {
                if (int.TryParse(ticketIdValue?.ToString(), out int ticketId))
                    return ticketId;
            }

            return null;
        }

        private object? GetRequestData(ActionExecutingContext context)
        {
            try
            {
                var requestData = new
                {
                    Arguments = context.ActionArguments,
                    QueryString = context.HttpContext.Request.QueryString.ToString(),
                    Headers = context.HttpContext.Request.Headers
                        .Where(h => !h.Key.StartsWith("Authorization") && !h.Key.StartsWith("Cookie"))
                        .ToDictionary(h => h.Key, h => h.Value.ToString())
                };
                return requestData;
            }
            catch
            {
                return null;
            }
        }

        private object? GetResponseData(ActionExecutedContext executedContext)
        {
            try
            {
                if (executedContext.Result is ObjectResult objResult)
                {
                    return new
                    {
                        StatusCode = objResult.StatusCode,
                        ValueType = objResult.Value?.GetType().Name
                    };
                }
                else if (executedContext.Result is StatusCodeResult statusResult)
                {
                    return new { StatusCode = statusResult.StatusCode };
                }
                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}
