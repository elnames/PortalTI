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

## Paz y Salvo
- `GET    /api/pazysalvo`
- `GET    /api/pazysalvo/{id}`
- `POST   /api/pazysalvo`
- `PUT    /api/pazysalvo/{id}`
- `DELETE /api/pazysalvo/{id}`
- `GET    /api/pazysalvo/{id}/download`
- `GET    /api/pazysalvo/activos-pendientes/{usuarioId}`

## Notificaciones (resumen)
- `GET /api/notifications`
- `POST /api/notifications/read`
- `DELETE /api/notifications/{id}`
- `DELETE /api/notifications`

## Calendario (resumen)
- `GET    /api/calendario/events`
- `GET    /api/calendario/events/{id}`
- `POST   /api/calendario/events`
- `PUT    /api/calendario/events/{id}`
- `DELETE /api/calendario/events/{id}`
