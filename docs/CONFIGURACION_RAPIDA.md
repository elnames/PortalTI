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

## ⚡ **Configuración de Microsoft Teams**

### **Solución al Error AADSTS700016**

El error que estás viendo significa que necesitas configurar Azure AD correctamente.

## 📋 **Pasos Rápidos (5 minutos)**

### **1. Crear archivo .env**
Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de Microsoft Graph
REACT_APP_MICROSOFT_CLIENT_ID=tu-client-id-real-aqui
REACT_APP_MICROSOFT_TENANT_ID=common
REACT_APP_MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback
```

### **2. Registrar aplicación en Azure AD**

1. **Ve a [Azure Portal](https://portal.azure.com)**
2. **Azure Active Directory** → **Registros de aplicaciones**
3. **Nuevo registro**
4. **Configura:**
   - **Nombre**: `Portal TI Calendar`
   - **Tipos de cuenta**: `Cuentas en cualquier directorio organizacional`
   - **URI de redirección**: `http://localhost:3000/auth/microsoft/callback`

### **3. Obtener Client ID**

1. **Copia el "ID de aplicación (cliente)"**
2. **Pégalo en el archivo .env** reemplazando `tu-client-id-real-aqui`

### **4. Configurar Permisos**

1. **Ve a "Permisos de API"**
2. **Agregar permisos** → **Microsoft Graph**
3. **Agregar estos permisos:**
   - `Calendars.ReadWrite` (Aplicación)
   - `User.Read` (Delegado)
   - `OnlineMeetings.ReadWrite` (Aplicación)

### **5. Reiniciar la aplicación**

```bash
npm start
```

## ✅ **Verificación**

Una vez configurado correctamente:
- El botón "Conectar con Microsoft" funcionará
- Podrás crear reuniones reales de Teams
- Los enlaces se generarán automáticamente

## 🔧 **Solución Temporal (Sin Azure AD)**

Si quieres probar el calendario sin Teams por ahora:

1. **Comenta la sección de Microsoft** en el sidebar
2. **Usa solo las funcionalidades básicas** del calendario
3. **Las reuniones se crearán con enlaces de fallback**

## 📞 **¿Necesitas Ayuda?**

- **Error persistente**: Verifica que el Client ID sea correcto
- **Permisos**: Asegúrate de que el administrador apruebe los permisos
- **Tenant**: Verifica que estés en el tenant correcto

¡Con estos pasos tendrás Teams funcionando en 5 minutos! 🎉

---

## 🆕 **Mejoras Recientes del Sistema**

### **📅 Calendario Mejorado**
- ✅ **Filtrado inteligente** por categorías y búsqueda
- ✅ **Sin bucles infinitos** - Rendimiento optimizado
- ✅ **Responsive design** - Funciona perfecto en móviles

### **📱 Notificaciones Optimizadas**
- ✅ **Diseño móvil** - Sin corte en pantallas pequeñas
- ✅ **Contador de eventos** - Muestra filtrados vs totales
- ✅ **Transiciones suaves** - Mejor experiencia visual

### **📄 Actas de Entrega**
- ✅ **Firmas digitales** - Sin texto SHA256 molesto
- ✅ **Previsualización temporal** - Para imprimir sin guardar
- ✅ **Rutas portables** - Funciona en cualquier equipo

### **💾 Gestión de Archivos**
- ✅ **Paz y salvo** - Subida de archivos corregida
- ✅ **Storage robusto** - Rutas relativas portables
- ✅ **Logs de debug** - Para troubleshooting fácil

### **🗄️ Base de Datos**
- ✅ **Script genérico** - Sin usuarios autenticados automáticos
- ✅ **Solo datos de prueba** - Activos, tickets, actas
- ✅ **Preserva admins** - Mantiene usuarios existentes

---

**¡El sistema está más estable y funcional que nunca!** 🚀
