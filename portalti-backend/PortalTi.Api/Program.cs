// Program.cs
using PortalTi.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using PortalTi.Api.Services;
using PortalTi.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// 1) DbContext
builder.Services.AddDbContext<PortalTiContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2) JWT Authentication
var jwtKey    = builder.Configuration["Jwt:Key"]    ?? throw new InvalidOperationException("Jwt:Key no configurado");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer no configurado");
var jwtAud    = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience no configurado");
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
            ClockSkew                = TimeSpan.Zero
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

builder.Services.AddAuthorization();

// 3) Services
builder.Services.AddScoped<PdfService>();
builder.Services.AddScoped<INotificationsService, NotificationsService>();

// 4) Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// SignalR para notificaciones en tiempo real
builder.Services.AddSignalR();
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

// 5) CORS: política específica para el front en localhost:3000
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

// 6) Aplicar migraciones pendientes y preparar datos base
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PortalTiContext>();
    // Aplicar migraciones (schema-first correcto)
    context.Database.Migrate();

    // Sembrar datos si la BD está vacía
    DbInitializer.SeedIfEmpty(context);
}

// 7) Middlewares (¡¡¡orden crítico!!!)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "PortalTI.Api v1"));
}

// 7.1) Enrutamiento
app.UseRouting();

// 7.2) CORS (ya con rutas definidas)
app.UseCors("FrontCorsPolicy");

// 7.3) HTTPS, AuthN y AuthZ
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// 7.4) Mapeo de endpoints
app.MapControllers();

// Mapear SignalR Hubs
app.MapHub<NotificationsHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
