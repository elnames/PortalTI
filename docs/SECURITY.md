# 🔒 Security Policy - PortalTI

[← Galería de Screenshots](./screenshots.md) | [API Documentation →](./API.md)

## Seguridad en PortalTI

## Autenticación y Autorización
- JWT Bearer configurado con `JwtSettings` (`SecretKey`, `Issuer`, `Audience`, `ExpirationMinutes`).
- Policies por acción planificadas en `Program.cs` (ver `docs/TODO.md`).
- Endpoints decorados con `[Authorize]` y excepciones explícitas con `[AllowAnonymous]` (e.g., `GET /api/actas/test`).

## Cabeceras de Seguridad
- HSTS (opcional por entorno), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Content-Security-Policy básica.

## Rate Limiting
- Límite global y políticas específicas para: login, subidas de archivos y búsquedas.
- Exclusión de `/hubs` para conexiones SignalR.

## Almacenamiento Seguro
- Archivos fuera de `wwwroot` en `Storage:Root`.
- Acceso vía `SecureFileController` (download/preview) con autorización.
- Validación estricta: tamaño, extensión, MIME real, magic numbers.
- Hash SHA256 para integridad de PDFs y verificación opcional.

## Auditoría
- `AuditLog` con `UserId`, `Action`, `ResourceType`, `ResourceId`, `Ip`, `UserAgent`, `Timestamp`, `DataJson`.
- Filtro `[AuditAction]` aplicado en endpoints críticos (actas, tickets, notificaciones, usuarios, activos).

## SignalR
- `KeepAliveInterval` y `ClientTimeoutInterval` configurados.
- Grupos por `user_{userId}` y `role_{role}`.

## CORS
- Política configurada por entorno (dominios permitidos, credenciales si aplica).

## Configuración
```json
{
  "JwtSettings": {
    "SecretKey": "<cambiar>",
    "Issuer": "PortalTI",
    "Audience": "PortalTIUsers",
    "ExpirationMinutes": 1440
  },
  "Storage": {
    "Root": "C:/PortalTI/Storage",
    "MaxFileSizeMB": 10,
    "AllowedExtensions": [".pdf", ".png", ".jpg"],
    "RetentionDays": 180,
    "EnableHashVerification": true
  }
}
```

## Checklist Rápido
- [ ] JWT válido y consistente (`Program` y `AuthController`).
- [ ] Policies aplicadas a endpoints sensibles.
- [ ] Headers de seguridad habilitados.
- [ ] Rate limits activos y correctos.
- [ ] Archivos en `Storage` y servidos por endpoints.
- [ ] Auditoría activa en endpoints críticos.
- [ ] Healthcheck `/api/actas/test` sin auth.

