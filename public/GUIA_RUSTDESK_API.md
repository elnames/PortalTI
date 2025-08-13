# 🔧 Guía para Habilitar la API REST de RustDesk

## 🚨 Problema Identificado

Los errores `ERR_CONNECTION_REFUSED` indican que **RustDesk no tiene habilitada la API REST** o **no está ejecutándose correctamente**.

## 📋 Pasos para Solucionar

### **Paso 1: Verificar que RustDesk esté ejecutándose**
1. Abre RustDesk en tu equipo
2. Verifica que aparezca en la bandeja del sistema (tray)
3. Asegúrate de que no esté minimizado

### **Paso 2: Habilitar la API REST**
1. **Abre RustDesk**
2. **Haz clic derecho** en el ícono de RustDesk en la bandeja del sistema
3. **Selecciona "Configuración"** o "Settings"
4. **Ve a la pestaña "Avanzado"** o "Advanced"
5. **Busca la opción "Habilitar API REST"** o "Enable REST API"
6. **Marca la casilla** para habilitarla
7. **Haz clic en "Aplicar"** o "OK"
8. **Reinicia RustDesk** completamente

### **Paso 3: Verificar la configuración**
1. **Abre el Administrador de tareas** (Ctrl + Shift + Esc)
2. **Busca el proceso "rustdesk.exe"**
3. **Verifica que esté ejecutándose**
4. **Abre el navegador** y ve a: `http://localhost:21117/api/overview`
5. **Si funciona**, deberías ver un JSON con información de RustDesk

### **Paso 4: Verificar puertos**
1. **Abre el Símbolo del sistema** como administrador
2. **Ejecuta:** `netstat -an | findstr 21117`
3. **Deberías ver:** `TCP    0.0.0.0:21117    LISTENING`
4. **También verifica:** `netstat -an | findstr 21116`

## 🔍 Diagnóstico Automático

### **Usar la página de diagnóstico:**
1. Abre: `http://localhost:3000/rustdesk-id-capture.html`
2. La página verificará automáticamente el estado de RustDesk
3. Te mostrará si está funcionando correctamente

### **Verificar manualmente:**
```bash
# En el navegador, prueba estas URLs:
http://localhost:21117/api/overview
http://localhost:21116/api/overview
```

## ⚠️ Problemas Comunes

### **1. API REST no habilitada**
- **Síntoma:** `ERR_CONNECTION_REFUSED`
- **Solución:** Habilitar en Configuración → Avanzado

### **2. Firewall bloqueando**
- **Síntoma:** No se puede conectar a los puertos
- **Solución:** Permitir RustDesk en el firewall de Windows

### **3. Puertos ocupados**
- **Síntoma:** Puerto ya en uso
- **Solución:** Reiniciar RustDesk o cambiar puertos

### **4. RustDesk no ejecutándose**
- **Síntoma:** No hay proceso rustdesk.exe
- **Solución:** Ejecutar RustDesk manualmente

## 🛠️ Comandos de Verificación

### **Verificar procesos:**
```cmd
tasklist | findstr rustdesk
```

### **Verificar puertos:**
```cmd
netstat -an | findstr 21117
netstat -an | findstr 21116
```

### **Verificar servicios:**
```cmd
sc query | findstr rustdesk
```

## 📱 Configuración Alternativa

### **Si la API REST no funciona:**

1. **Usar captura manual:**
   - Abre RustDesk
   - Copia el ID manualmente de la ventana
   - Pégalo en el chat

2. **Usar la página HTML independiente:**
   - Abre `rustdesk-id-capture.html`
   - Sigue las instrucciones paso a paso

3. **Verificar versión de RustDesk:**
   - Asegúrate de usar una versión reciente
   - Descarga desde: https://rustdesk.com/

## 🔄 Reinicio Completo

Si nada funciona, haz un reinicio completo:

1. **Cierra RustDesk** completamente
2. **Abre el Administrador de tareas**
3. **Termina todos los procesos** relacionados con RustDesk
4. **Reinicia tu equipo**
5. **Abre RustDesk** como administrador
6. **Habilita la API REST** nuevamente
7. **Prueba la captura automática**

## 📞 Soporte

Si después de seguir todos estos pasos sigue sin funcionar:

1. **Verifica la versión** de RustDesk
2. **Revisa los logs** de RustDesk
3. **Contacta al administrador** del sistema
4. **Usa la captura manual** como alternativa

---

**Nota:** La captura automática es una característica avanzada. Si no funciona, siempre puedes copiar manualmente el ID de la ventana de RustDesk.

