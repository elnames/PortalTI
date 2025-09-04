# 🔒 Security Policy - PortalTI

## 📸 Security Screenshots

Esta sección contiene capturas de pantalla que demuestran las medidas de seguridad implementadas en PortalTI.

### 🔐 Authentication & Authorization Screenshots
- `security-login-form.png` - Formulario de login con validación
- `security-jwt-token.png` - Token JWT en DevTools
- `security-role-based-access.png` - Control de acceso por roles
- `security-unauthorized-access.png` - Respuesta 401/403 para acceso no autorizado

### 🛡️ Security Headers Screenshots
- `security-headers-response.png` - Headers de seguridad en respuesta HTTP
- `security-cors-configuration.png` - Configuración CORS
- `security-hsts-header.png` - Header HSTS activo

### 📁 Secure File Storage Screenshots
- `security-file-upload-validation.png` - Validación de archivos subidos
- `security-secure-download.png` - Descarga segura de archivos
- `security-file-hash-verification.png` - Verificación de hash SHA256
- `security-storage-structure.png` - Estructura de almacenamiento seguro

### 🔍 Audit & Monitoring Screenshots
- `security-audit-logs.png` - Logs de auditoría
- `security-user-activity.png` - Actividad de usuarios
- `security-rate-limiting.png` - Rate limiting en acción
- `security-error-handling.png` - Manejo seguro de errores

### 🌐 Network Security Screenshots
- `security-https-enforcement.png` - Forzado de HTTPS
- `security-signalr-connection.png` - Conexión segura SignalR
- `security-api-endpoints.png` - Endpoints API protegidos

## 🚨 Reporting Security Vulnerabilities

Si descubres una vulnerabilidad de seguridad, por favor:

1. **NO** crear un issue público
2. Enviar un email a: `javier.rjorquera@gmail.com`
3. Incluir:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducir
   - Screenshots si es posible
   - Impacto potencial

## 🔧 Security Features Implemented

### Authentication & Authorization
- ✅ JWT Bearer tokens con expiración configurable
- ✅ Roles granulares (admin, soporte, usuario)
- ✅ Endpoints protegidos con `[Authorize]`
- ✅ Validación de tokens en SignalR

### Data Protection
- ✅ Almacenamiento seguro fuera de `wwwroot`
- ✅ Validación estricta de archivos
- ✅ Hash SHA256 para integridad
- ✅ Encriptación de contraseñas con HMACSHA512

### Network Security
- ✅ Headers de seguridad (HSTS, CSP, X-Frame-Options)
- ✅ CORS configurado por entorno
- ✅ Rate limiting por endpoint
- ✅ HTTPS enforcement

### Monitoring & Auditing
- ✅ Logs de auditoría completos
- ✅ Tracking de actividad de usuarios
- ✅ Monitoreo de intentos de acceso
- ✅ Alertas de seguridad

## 📋 Security Checklist

- [ ] JWT tokens configurados correctamente
- [ ] Headers de seguridad activos
- [ ] Rate limiting funcionando
- [ ] Archivos almacenados de forma segura
- [ ] Auditoría activa en endpoints críticos
- [ ] Validación de entrada en todos los formularios
- [ ] Manejo seguro de errores
- [ ] Logs de seguridad monitoreados

## 🔗 Related Documentation

- [📚 Technical Documentation](./DOCUMENTACION_TECNICA.md)
- [📸 All Screenshots](./screenshots/README.md)
- [🔧 API Documentation](./docs/API.md)

---

**PortalTI Security Team**  
*Última actualización: Septiembre 2025*
