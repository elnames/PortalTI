# API (visión general)

## Autenticación
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET  /api/auth/profile`
- `POST /api/auth/upload-signature`

## Actas
- `POST /api/actas/generar`
- `POST /api/actas/firmar-digital`
- `POST /api/actas/subir-pdf`
- `POST /api/actas/subir-admin`
- `POST /api/actas/{id}/aprobar`
- `POST /api/actas/{id}/rechazar`
- `POST /api/actas/{id}/pendiente`
- `POST /api/actas/{id}/upload-pdf-ti`
- `POST /api/actas/{id}/anular`
- `GET  /api/actas/{id}/preview-auto`
- `GET  /api/actas/test`

## Archivos seguros
- `GET /api/securefile/preview/{tipo}/{archivo}`
- `GET /api/securefile/download/{tipo}/{archivo}`
- `POST /api/securefile/verify`

## Paz y Salvo (Sistema Unificado)
### Documentos
- `GET    /api/pazysalvo`                    // Listar documentos
- `GET    /api/pazysalvo/{id}`               // Obtener documento
- `POST   /api/pazysalvo`                    // Crear documento
- `PUT    /api/pazysalvo/{id}`               // Actualizar documento
- `DELETE /api/pazysalvo/{id}`               // Eliminar documento

### Flujo de Firmas
- `POST   /api/pazysalvo/{id}/send`          // Enviar a firma
- `POST   /api/pazysalvo/{id}/firmas/{rol}/sign`    // Firmar documento
- `POST   /api/pazysalvo/{id}/firmas/{rol}/reject`  // Rechazar documento
- `POST   /api/pazysalvo/{id}/firmas/{rol}/observe` // Agregar observación

### Gestión de Roles
- `GET    /api/pazysalvo/roles`              // Listar roles
- `POST   /api/pazysalvo/roles`              // Crear rol
- `PUT    /api/pazysalvo/roles/{id}`         // Actualizar rol
- `DELETE /api/pazysalvo/roles/{id}`         // Eliminar rol

### Delegaciones
- `GET    /api/pazysalvo/delegations`        // Listar delegaciones
- `POST   /api/pazysalvo/delegations`        // Crear delegación
- `PUT    /api/pazysalvo/delegations/{id}`   // Actualizar delegación
- `DELETE /api/pazysalvo/delegations/{id}`   // Eliminar delegación

### Archivos y Descarga
- `GET    /api/pazysalvo/{id}/pdf`           // Descargar PDF final
- `POST   /api/pazysalvo/{id}/adjuntos`      // Subir adjunto
- `GET    /api/pazysalvo/activos-pendientes/{usuarioId}` // Activos pendientes

## Notificaciones (resumen)
- `GET /api/notifications`
- `POST /api/notifications/read`
- `DELETE /api/notifications/{id}`
- `DELETE /api/notifications`

