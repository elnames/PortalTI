# 🔧 Explicación: Captura Manual vs Automática

## 🚨 ¿Por qué se eliminó la captura automática?

### **Problema Principal:**
La captura automática de RustDesk requiere que **RustDesk tenga habilitada la API REST**, lo cual es una configuración avanzada que:

1. **No viene habilitada por defecto** en RustDesk
2. **Requiere configuración manual** en Configuración → Avanzado
3. **Puede causar problemas de seguridad** si no se configura correctamente
4. **No funciona en todas las versiones** de RustDesk
5. **Requiere permisos especiales** en el firewall

### **Errores que aparecían:**
```
ERR_CONNECTION_REFUSED :21117/api/overview
WebSocket connection to 'ws://localhost:21117/' failed
```

Estos errores indican que **RustDesk no tiene la API REST habilitada**.

## ✅ **Solución Implementada: Captura Manual**

### **Ventajas de la captura manual:**
- ✅ **Funciona siempre** - No requiere configuración especial
- ✅ **Más seguro** - No expone APIs innecesarias
- ✅ **Más simple** - Solo copiar y pegar
- ✅ **Más confiable** - No depende de configuraciones externas
- ✅ **Compatible con todas las versiones** de RustDesk

### **Cómo funciona ahora:**
1. **Abre RustDesk** en tu equipo
2. **Copia el ID** que aparece en la ventana principal
3. **Pégalo** en el campo "ID de RustDesk"
4. **Opcional:** Copia la contraseña si configuraste una
5. **Haz clic en "Enviar Credenciales"** o **"Copiar"**

## 🔄 **Si quieres habilitar la captura automática (Opcional)**

Si realmente quieres usar la captura automática, necesitas:

### **Paso 1: Habilitar API REST en RustDesk**
1. Abre RustDesk
2. Haz clic derecho en el ícono de la bandeja del sistema
3. Selecciona "Configuración" o "Settings"
4. Ve a la pestaña "Avanzado" o "Advanced"
5. Marca la casilla "Habilitar API REST" o "Enable REST API"
6. Haz clic en "Aplicar" y "OK"
7. Reinicia RustDesk

### **Paso 2: Verificar que funciona**
Abre tu navegador y ve a:
- `http://localhost:21117/api/overview`

Si ves un JSON con información de RustDesk, la API está habilitada.

### **Paso 3: Configurar firewall**
Permite RustDesk en el firewall de Windows para los puertos 21116-21117.

## 🎯 **Recomendación**

**Usa la captura manual** porque:
- Es más simple y confiable
- No requiere configuración especial
- Funciona en todos los casos
- Es más seguro

La captura automática es una característica avanzada que puede ser útil en entornos controlados, pero para uso general, la captura manual es la mejor opción.

---

**Nota:** Si necesitas la captura automática por alguna razón específica, contacta al administrador del sistema para que configure RustDesk correctamente.

