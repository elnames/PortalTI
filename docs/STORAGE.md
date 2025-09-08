# Almacenamiento y Archivos Seguros

## Raíz de Storage
- Configurada en `appsettings.json` como `Storage:Root` (relativa: `"Storage"`).
- Ubicada fuera de `wwwroot` para evitar exposición pública.
- **Mejora reciente**: Resolución robusta de rutas para portabilidad entre equipos.

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
- **Mejora reciente**: Eliminación de texto SHA256 en observaciones de firmas digitales.

## Limpieza y Retención
- `RetentionDays` define retención de temporales (planificar tarea periódica de limpieza).

## Configuración de ejemplo
```json
{
  "Storage": {
    "Root": "Storage",
    "MaxFileSizeMB": 10,
    "AllowedExtensions": [".pdf", ".png", ".jpg"],
    "RetentionDays": 180,
    "EnableHashVerification": true
  }
}
```

---

## 🚀 **Mejoras Recientes en Storage**

### **📁 Resolución Robusta de Rutas**
- **Rutas relativas**: Configuración portable entre equipos
- **Resolución automática**: Combina correctamente con `Directory.GetCurrentDirectory()`
- **Estandarización**: Mismo manejo en todos los controladores
- **Logs de debug**: Para troubleshooting de archivos

### **📄 Sistema de Actas Mejorado**
- **Previsualización temporal**: Sin guardar en Storage
- **Separación de funcionalidades**: Generar vs Previsualizar
- **Firmas limpias**: Sin texto SHA256 en observaciones
- **Endpoints optimizados**: Mejor rendimiento y claridad

### **📋 Paz y Salvo Funcional**
- **Subida corregida**: Resolución de rutas arreglada
- **Almacenamiento seguro**: En directorio `pazysalvo`
- **Gestión completa**: Crear, editar, eliminar, descargar
- **Logs de debug**: Para verificar funcionamiento

### **🔧 Controladores Actualizados**
- **ActasController**: Rutas corregidas para previsualización y eliminación
- **AuthController**: Resolución robusta para subida de firmas
- **PazYSalvoController**: Rutas corregidas para todos los endpoints
- **SecureFileController**: Resolución robusta en constructor

**¡El sistema de Storage ahora es más robusto y portable!** 🎉
