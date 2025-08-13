# 🔧 Solución para Captura Automática de RustDesk

## 🚨 Problema Identificado

Los errores `ERR_CONNECTION_REFUSED` en los puertos 21116-21117 indican que **RustDesk no tiene habilitada la API REST** o **no está configurado correctamente**.

## 🔍 Diagnóstico Rápido

### **1. Verificar si RustDesk está ejecutándose:**
```cmd
tasklist | findstr rustdesk
```

### **2. Verificar si los puertos están abiertos:**
```cmd
netstat -an | findstr 21117
netstat -an | findstr 21116
```

**Resultado esperado:**
```
TCP    0.0.0.0:21117    LISTENING
TCP    0.0.0.0:21116    LISTENING
```

### **3. Probar la API manualmente:**
Abre tu navegador y ve a:
- `http://localhost:21117/api/overview`
- `http://localhost:21116/api/overview`

**Si funciona:** Verás un JSON con información de RustDesk
**Si no funciona:** Verás "ERR_CONNECTION_REFUSED"

## 🛠️ Solución Paso a Paso

### **Paso 1: Habilitar API REST en RustDesk**

1. **Abre RustDesk**
2. **Haz clic derecho** en el ícono de la bandeja del sistema
3. **Selecciona "Configuración"** o **"Settings"**
4. **Ve a la pestaña "Avanzado"** o **"Advanced"**
5. **Busca y marca la casilla:**
   - ✅ **"Habilitar API REST"** o **"Enable REST API"**
   - ✅ **"Habilitar WebSocket"** o **"Enable WebSocket"** (si existe)
6. **Haz clic en "Aplicar"** y **"OK"**
7. **Reinicia RustDesk completamente**

### **Paso 2: Verificar Configuración de Red**

1. **Abre el Firewall de Windows**
2. **Busca "RustDesk"** en las aplicaciones permitidas
3. **Si no está, agrégalo manualmente:**
   - Busca el ejecutable de RustDesk
   - Permite acceso en redes privadas y públicas
   - Permite puertos 21116 y 21117

### **Paso 3: Verificar Puertos**

```cmd
# Como administrador, ejecuta:
netstat -an | findstr 21117
netstat -an | findstr 21116
```

**Si no ves los puertos LISTENING:**
1. Reinicia RustDesk
2. Ejecuta RustDesk como administrador
3. Verifica que la API REST esté habilitada

## 🔄 Soluciones Alternativas

### **Opción 1: Usar Captura Manual (Recomendada)**
1. Abre RustDesk
2. Copia el ID y contraseña manualmente
3. Usa el botón **"Ingresar Manualmente"** en el modal
4. Pega el ID y contraseña
5. Haz clic en **"Enviar Credenciales"**

### **Opción 2: Configurar RustDesk como Servicio**
```cmd
# Como administrador:
sc create "RustDesk" binPath= "C:\ruta\a\rustdesk.exe" start= auto
sc start "RustDesk"
```

### **Opción 3: Usar Puertos Alternativos**
Si los puertos 21116-21117 están ocupados:
1. En RustDesk, ve a Configuración → Avanzado
2. Cambia los puertos de la API REST
3. Actualiza la configuración en el código

## 🐛 Problemas Comunes y Soluciones

### **Problema 1: "ERR_CONNECTION_REFUSED"**
**Causa:** API REST no habilitada
**Solución:** Habilitar en Configuración → Avanzado

### **Problema 2: "WebSocket connection failed"**
**Causa:** WebSocket no habilitado o firewall bloqueando
**Solución:** Habilitar WebSocket y configurar firewall

### **Problema 3: "Puerto ya en uso"**
**Causa:** Otro proceso usando los puertos
**Solución:** 
```cmd
# Encontrar qué usa el puerto:
netstat -ano | findstr 21117
# Terminar el proceso:
taskkill /PID [número_del_proceso] /F
```

### **Problema 4: "RustDesk no responde"**
**Causa:** RustDesk colgado o mal configurado
**Solución:**
1. Terminar todos los procesos de RustDesk
2. Reiniciar el equipo
3. Ejecutar RustDesk como administrador

## 📱 Configuración Avanzada

### **Archivo de Configuración de RustDesk:**
Busca el archivo `config/RustDesk.toml` y agrega:
```toml
[api]
enabled = true
port = 21117
websocket_port = 21117
```

### **Variables de Entorno:**
```cmd
set RUSTDESK_API_ENABLED=1
set RUSTDESK_API_PORT=21117
```

## 🔧 Comandos de Diagnóstico

### **Verificar Estado Completo:**
```cmd
# Verificar procesos
tasklist | findstr rustdesk

# Verificar puertos
netstat -an | findstr 21117
netstat -an | findstr 21116

# Verificar servicios
sc query | findstr rustdesk

# Verificar firewall
netsh advfirewall firewall show rule name=all | findstr rustdesk
```

### **Reiniciar Servicios:**
```cmd
# Como administrador:
taskkill /f /im rustdesk.exe
timeout /t 5
start "" "C:\ruta\a\rustdesk.exe"
```

## ✅ Verificación Final

Después de aplicar las soluciones:

1. **Abre:** `http://localhost:21117/api/overview`
2. **Deberías ver:** JSON con información de RustDesk
3. **Prueba la captura automática** en el modal
4. **Si funciona:** ¡Perfecto!
5. **Si no funciona:** Usa la opción manual

## 🆘 Si Nada Funciona

### **Última Opción - Captura Manual:**
1. Abre RustDesk
2. Copia el ID y contraseña de la ventana
3. Usa el botón **"Ingresar Manualmente"**
4. Pega las credenciales
5. Envía al administrador

### **Contactar Soporte:**
- Verifica la versión de RustDesk
- Revisa los logs de RustDesk
- Contacta al administrador del sistema

---

**Nota:** La captura automática es una característica avanzada que requiere configuración específica. La opción manual siempre está disponible como alternativa confiable.

