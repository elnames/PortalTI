# Configuración de RustDesk

## 📁 Ubicación del Ejecutable

Coloca el ejecutable de RustDesk en esta carpeta (`public/`) con el nombre `rustdesk.exe`.

## 📥 Descarga de RustDesk

1. Ve a https://rustdesk.com/
2. Descarga la versión para Windows
3. Renombra el archivo descargado a `rustdesk.exe`
4. Colócalo en esta carpeta (`public/`)

## 🔧 Funcionamiento

Cuando un usuario haga clic en "Descargar RustDesk" desde el modal de configuración, el navegador descargará automáticamente el archivo `rustdesk.exe` desde esta ubicación.

## 🎯 Captura Automática del ID

### Método 1: Desde el Modal (Integrado)
- El modal de configuración incluye un botón "Capturar ID Automáticamente"
- Intenta conectarse a la API REST de RustDesk en los puertos 21116-21117
- Si funciona, muestra el ID capturado y permite copiarlo

### Método 2: Página HTML Independiente
- Archivo: `rustdesk-id-capture.html`
- Se puede abrir directamente en el navegador
- Útil si el modal no funciona o para pruebas independientes

### Métodos de Captura Implementados:
1. **API REST (Puerto 21117)**: Método principal
2. **API REST (Puerto 21116)**: Método alternativo  
3. **WebSocket**: Conexión directa a RustDesk

## ⚠️ Notas Importantes

- El archivo debe llamarse exactamente `rustdesk.exe`
- Asegúrate de que el archivo sea la versión oficial de RustDesk
- El archivo será servido estáticamente por el servidor web
- La captura automática funciona mejor si RustDesk está ejecutándose
- Verifica que no haya firewalls bloqueando los puertos 21116-21117
