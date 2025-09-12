# 🚀 Configuración Rápida - PortalTI

## 📋 **Configuración del Sistema de Paz y Salvo**

### **1. Base de Datos**
Ejecuta el script actualizado para crear las tablas del sistema unificado:

```sql
-- Ejecutar en SQL Server Management Studio
-- Archivo: portalti-backend/PortalTi.Api/Scripts/CREAR_BD_COMPLETA.sql
```

### **2. Configuración de Roles**
El sistema incluye roles predefinidos:
- **JefeInmediato**: Jefe directo del empleado
- **Contabilidad**: Departamento de contabilidad
- **Informatica**: Departamento de TI
- **GerenciaFinanzas**: Gerencia de finanzas

### **3. Flujo de Trabajo**
1. **Crear documento** de Paz y Salvo
2. **Enviar a firma** automáticamente
3. **Firmas por roles** en orden específico
4. **Generar PDF final** con todas las firmas

---

## ⚡ **Configuración Adicional**

### **Variables de Entorno**
Si necesitas configurar variables de entorno adicionales, crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración del sistema
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SIGNALR_URL=http://localhost:5000/hubs/notifications
```

### **Configuración de Base de Datos**
Asegúrate de que la cadena de conexión en `appsettings.json` sea correcta:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PortalTi;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

## ✅ **Verificación del Sistema**

1. **Abre** `http://localhost:3000`
2. **Inicia sesión** con las credenciales de admin
3. **Verifica** que todas las funcionalidades estén disponibles:
   - Gestión de activos
   - Sistema de tickets
   - Sistema de Paz y Salvo
   - Notificaciones

## 📞 **Soporte**

Si tienes problemas:
1. **Verifica** que el backend esté ejecutándose en el puerto 5000
2. **Reinicia** tanto el frontend como el backend
3. **Limpia** la caché del navegador
4. **Contacta** al desarrollador si persiste el problema