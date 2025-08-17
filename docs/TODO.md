# To-Do técnico (seguridad, integridad y operación)

## Seguridad y control de acceso
- [ ] Definir policies por acción en `Program.cs` (ej.: `CanApproveActa`, `CanRejectActa`, `CanManageAssets`, `CanDeleteNotifications`)
- [ ] Decorar endpoints críticos con `[Authorize(Policy="...")]`
- [ ] Tests de autorización (WebApplicationFactory) para 401/403 consistentes
- [ ] Rate limiting: `login`, subidas de archivos, búsquedas
- [ ] Endurecer CORS + HSTS + headers (X-Frame-Options, X-Content-Type-Options, CSP básica)
- [ ] Validación de entrada (atributos/FluentValidation) en DTOs de mutación

## Integridad de Actas
- [ ] Implementar máquina de estados con validador de transición (pendiente → firmada → aprobada, etc.)
- [ ] Control de concurrencia (rowversion/concurrency token) para evitar doble aprobación/rechazo
- [ ] Garantizar inmutabilidad del PDF aprobado: versionado + hash + quién/qué/cuándo en audit
- [ ] Simular concurrencia (test): dos aprobaciones simultáneas → una sola gana

## Manejo seguro de archivos
- [ ] Validación estricta en subidas: MIME real (magic number `%PDF`), tamaño máximo configurable
- [ ] Mover storage fuera de `wwwroot` a `Storage:Root` en `appsettings`
- [ ] Servir archivos por endpoint con streaming y autorización; sin acceso directo a disco
- [ ] Política de retención/limpieza para temporales (previews), tarea de GC programada

## Auditoría (DB y filtros)
- [ ] Tabla `AuditLog(Id, UserId, Action, ResourceType, ResourceId, Ip, UserAgent, Timestamp, DataJson)`
- [ ] Filtro/atributo global para registrar acciones en endpoints clave:
  - Actas: generar/firmar/subir/aprobar/rechazar/pendiente/anular
  - Asignaciones: crear/devolver/eliminar
  - Tickets: crear/asignar/cambiar estado/comentar
  - Usuarios/Activos: alta/edición/baja/rol/estado
- [ ] Export simple (CSV/JSON) por rango/acción/usuario

## Notificaciones (fiabilidad y UX)
- [ ] Idempotencia por evento (clave natural `Tipo:RefTipo:RefId:UserId[:window]`)
- [ ] TTL/retención en backend para notificaciones leídas antiguas
- [ ] Front: modal de confirmación “Borrar todas”
- [ ] Reconexión/backoff (ya) + verificación de entrega al reconectar (cargar pendientes)

## Paginación e índices
- [ ] `GET /notifications`: `skip/take` obligatorio (default 50) y orden por `CreatedAt DESC`
- [ ] Listados de actas/tickets: paginación + filtros índice-friendly
- [ ] Índices:
  - `Notificaciones(UserId, IsRead, CreatedAt DESC)` (validar)
  - `Actas(Estado, FechaCreacion DESC)`, `Actas(AsignacionId)`
  - `Tickets(Estado, AsignadoAId, FechaCreacion)`
  - `Activos(Codigo UNIQUE, Estado)`

## Operación, despliegue y backups
- [ ] Health checks (DB, disco disponible en `Storage:Root`, SignalR)
- [ ] Migraciones controladas por entorno (no `Migrate()` automático en prod sin flag)
- [ ] Plan de backup/restore: DB + carpeta de actas; script de verificación de hash vs audit
- [ ] Logging estructurado (Serilog) con `CorrelationId`

## UX de flujos críticos
- [ ] Confirmaciones en acciones destructivas: rechazar, anular, borrar todas
- [ ] Optimistic UI con rollback en fallos (aprobar/rechazar acta, cambiar estado ticket)
- [ ] Accesibilidad: focus management en modales, mensajes claros, atajos

## Identidad con nómina
- [ ] Vinculación única por RUT/correo; evitar duplicidad
- [ ] Usuarios inactivos/baja: bloquear login, creación de tickets/actas y registrar en audit
- [ ] Sincronización idempotente si se automatiza (no duplicar activos/usuarios)

## Integración de acceso remoto (RustDesk)
- [ ] Policies claras: quién puede iniciar/controlar sesiones
- [ ] Registro de sesión remota (inicio/fin/usuario/equipo) en auditoría
- [ ] No exponer secretos; tokens con TTL si se usan enlaces

---

### Orden recomendado
1) Policies + tests + rate limit + headers.
2) Validación PDF + storage externo + streaming protegido.
3) AuditLog + filtro global + cobertura en endpoints.
4) Idempotencia/TTL en notificaciones + confirmación “Borrar todas”.
5) Paginación/índices en actas/tickets y health checks.
6) UX confirmaciones/rollback y accesibilidad.


