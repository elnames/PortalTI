# Almacenamiento y Archivos Seguros

## Raíz de Storage
- Configurada en `appsettings.json` como `Storage:Root` (por ejemplo, `C:/PortalTI/Storage`).
- Ubicada fuera de `wwwroot` para evitar exposición pública.

## Estructura
- `Storage/actas/<categoria>/...pdf`
- `Storage/pazysalvo/...pdf`
- `Storage/signatures/...png`
- `Storage/evidence/...`

## Acceso Seguro
- Acceso solo vía API con JWT:
  - `GET /api/securefile/preview/{tipo}/{archivo}`
  - `GET /api/securefile/download/{tipo}/{archivo}`
  - `POST /api/securefile/verify` (verificación de hash)

## Validación en Subidas
- Tamaño máximo (`MaxFileSizeMB`).
- Extensiones permitidas (`AllowedExtensions`).
- Verificación de MIME y magic numbers (PDF: `%PDF`).
- Nombres únicos y cálculo de hash SHA256.

## Firmas Digitales
- Creación desde Perfil o modal de `Actas` (canvas) → guardadas en `Storage/signatures`.
- Si falta firma, los endpoints devuelven opciones para crearla/subir PDF.

## Limpieza y Retención
- `RetentionDays` define retención de temporales (planificar tarea periódica de limpieza).

## Configuración de ejemplo
```json
{
  "Storage": {
    "Root": "C:/PortalTI/Storage",
    "MaxFileSizeMB": 10,
    "AllowedExtensions": [".pdf", ".png", ".jpg"],
    "RetentionDays": 180,
    "EnableHashVerification": true
  }
}
```
