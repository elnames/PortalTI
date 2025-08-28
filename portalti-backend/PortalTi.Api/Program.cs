// Program.cs
using PortalTi.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using PortalTi.Api.Services;
using PortalTi.Api.Hubs;
using PortalTi.Api.Filters;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 1) DbContext
builder.Services.AddDbContext<PortalTiContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2) JWT Authentication
var jwtKey    = builder.Configuration["JwtSettings:SecretKey"]    ?? throw new InvalidOperationException("JwtSettings:SecretKey no configurado");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? throw new InvalidOperationException("JwtSettings:Issuer no configurado");
var jwtAud    = builder.Configuration["JwtSettings:Audience"] ?? throw new InvalidOperationException("JwtSettings:Audience no configurado");
var jwtExpirationMinutes = int.Parse(builder.Configuration["JwtSettings:ExpirationMinutes"] ?? "480");
var keyBytes  = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAud,
                     IssuerSigningKey         = new SymmetricSecurityKey(keyBytes),
         ClockSkew                = TimeSpan.Zero,
         ValidateLifetime         = true
        };

        // Configuración para SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// 3) Authorization Policies
builder.Services.AddAuthorization(options =>
{
    // Políticas para gestión de Actas
    options.AddPolicy("CanApproveActa", policy =>
        policy.RequireRole("admin", "soporte"));
    
    options.AddPolicy("CanRejectActa", policy =>
        policy.RequireRole("admin", "soporte"));
    
    options.AddPolicy("CanManageActas", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para gestión de Activos
    options.AddPolicy("CanManageAssets", policy =>
        policy.RequireRole("admin", "soporte"));
    
    options.AddPolicy("CanAssignAssets", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para gestión de Tickets
    options.AddPolicy("CanManageTickets", policy =>
        policy.RequireRole("admin", "soporte"));
    
    options.AddPolicy("CanAssignTickets", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para gestión de Usuarios
    options.AddPolicy("CanManageUsers", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para gestión de Notificaciones
    options.AddPolicy("CanDeleteNotifications", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para Reportes
    options.AddPolicy("CanViewReports", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para Paz y Salvo
    options.AddPolicy("CanManagePazYSalvo", policy =>
        policy.RequireRole("admin", "soporte"));
    
    // Políticas para Software Security
    options.AddPolicy("CanManageSoftwareSecurity", policy =>
        policy.RequireRole("admin"));
});

// 4) Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.IsAuthenticated == true 
                ? context.User.Identity.Name ?? "anonymous" 
                : context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 500,
                Window = TimeSpan.FromMinutes(1)
            }));
    
    // Rate limiting específico para login
    options.AddPolicy("LoginPolicy", context =>
    {
        if (context.Request.Path.StartsWithSegments("/hubs"))
        {
            return RateLimitPartition.GetNoLimiter("signalr");
        }
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(15)
            });
    });
    
    // Rate limiting para subidas de archivos
    options.AddPolicy("FileUploadPolicy", context =>
    {
        if (context.Request.Path.StartsWithSegments("/hubs"))
        {
            return RateLimitPartition.GetNoLimiter("signalr");
        }
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1)
            });
    });
    
    // Rate limiting para búsquedas
    options.AddPolicy("SearchPolicy", context =>
    {
        // No rate limit para websockets/signalr
        if (context.Request.Path.StartsWithSegments("/hubs"))
        {
            return RateLimitPartition.GetNoLimiter("signalr");
        }
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 50,
                Window = TimeSpan.FromMinutes(1)
            });
    });
});

// 5) Services
// Registrar servicios
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<FileSecurityService>();
builder.Services.AddScoped<NotificationsService>();
builder.Services.AddScoped<PdfService>();
builder.Services.AddScoped<ActaValidationService>();
builder.Services.AddScoped<ISystemConfigurationService, SystemConfigurationService>();

// Servicios de integridad de datos
builder.Services.AddScoped<IActaValidationService, ActaValidationService>();
builder.Services.AddScoped<IFileSecurityService, FileSecurityService>();

// 6) Controllers + Swagger
builder.Services.AddControllers(options =>
{
    options.Filters.Add<AuditActionFilter>();
});
builder.Services.AddEndpointsApiExplorer();

// SignalR para notificaciones en tiempo real (mantener conexiones estables)
builder.Services.AddSignalR(o =>
{
    o.KeepAliveInterval = TimeSpan.FromSeconds(15);
    o.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
});
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PortalTI.Api", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description  = "JWT Bearer. Ejemplo: \"Bearer {token}\"",
        Name         = "Authorization",
        In           = ParameterLocation.Header,
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                },
                Scheme = "bearer",
                Name   = "Authorization",
                In     = ParameterLocation.Header
            },
            Array.Empty<string>()
        }
    });
});

// 7) CORS: política específica para el front en localhost:3000
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontCorsPolicy", policy =>
        policy
          .WithOrigins("http://localhost:3000")
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials()
          .SetIsOriginAllowed(origin => true) // Permitir cualquier origen en desarrollo
    );
});

var app = builder.Build();

// 8) Aplicar migraciones pendientes y preparar datos base
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PortalTiContext>();
    // Intentar aplicar migraciones; si hay cambios pendientes no migrados en dev, continuar sin romper
    try { context.Database.Migrate(); } catch { /* dev-only: continuar */ }

    // Salvavidas: asegurar esquema de Notificaciones en entornos desfasados
    SchemaFixer.EnsureNotificationsSchema(context);

    // Sembrar datos si la BD está vacía
    DbInitializer.SeedIfEmpty(context);
}

// 9) Middlewares (¡¡¡orden crítico!!!)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "PortalTI.Api v1"));
}

// 9.1) Enrutamiento
app.UseRouting();

// 9.2) CORS (ya con rutas definidas)
app.UseCors("FrontCorsPolicy");

// 9.3) Rate Limiting
app.UseRateLimiter();

// 9.4) HTTPS, AuthN y AuthZ
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// 9.5) Security Headers
app.Use(async (context, next) =>
{
    // HSTS
    if (!context.Response.Headers.ContainsKey("Strict-Transport-Security"))
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    // X-Frame-Options
    if (!context.Response.Headers.ContainsKey("X-Frame-Options"))
    {
        context.Response.Headers.Append("X-Frame-Options", "DENY");
    }
    
    // X-Content-Type-Options
    if (!context.Response.Headers.ContainsKey("X-Content-Type-Options"))
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    }
    
    // Referrer-Policy
    if (!context.Response.Headers.ContainsKey("Referrer-Policy"))
    {
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    }
    
    // Content-Security-Policy básica
    if (!context.Response.Headers.ContainsKey("Content-Security-Policy"))
    {
        context.Response.Headers.Append("Content-Security-Policy", 
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:;");
    }
    
    await next();
});

// 9.6) Mapeo de endpoints
app.MapControllers();

// Mapear SignalR Hubs
app.MapHub<NotificationsHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
