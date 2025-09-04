# 📚 Documentación Técnica - PortalTI

[← Documentación Principal](./README.md) | [Galería de Screenshots →](./screenshots.md)

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Base de Datos](#base-de-datos)
3. [API Backend](#api-backend)
4. [Frontend React](#frontend-react)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Guías de Desarrollo](#guías-de-desarrollo)
9. [Integración RustDesk](#integración-rustdesk)
10. [Sistema de Chat en Tiempo Real](#sistema-de-chat-en-tiempo-real)
11. [Sistema de Paz y Salvo](#sistema-de-paz-y-salvo)
12. [Calendario de TI](#calendario-de-ti)

---

## 🏗️ Arquitectura del Sistema

### **Arquitectura General**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   React         │◄──►│   ASP.NET Core  │◄──►│   Datos         │
│   + SignalR     │    │   API + SignalR │    │   SQL Server    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RustDesk      │    │   SignalR Hub   │    │   Archivos      │
│   Integration   │    │   (Chat)        │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Stack Tecnológico**
- **Frontend**: React 18 + Tailwind CSS + React Router + SignalR Client
- **Backend**: ASP.NET Core 8 + Entity Framework Core + SignalR
- **Base de Datos**: SQL Server 2019+
- **Autenticación**: JWT Bearer Tokens
- **Comunicación**: REST API + SignalR (para chat en tiempo real)
- **Control Remoto**: RustDesk Integration
- **Archivos**: Sistema de archivos privado en `Storage` + endpoints seguros

---

## 🗄️ Base de Datos

### **Diagrama ER Actualizado**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AuthUsers     │    │ NominaUsuarios  │    │     Activos     │
│   (Autenticación)│    │   (Usuarios BD) │    │   (Inventario)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │AsignacionesActivos│
                    │  (Relación)     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │     Tickets     │    │     Actas       │
                    │   (Soporte)     │    │  (Documentos)   │
                    └─────────────────┘    └─────────────────┘
                                 │                       │
                    ┌─────────────────┐    ┌─────────────────┐
                    │ComentariosTickets│    │ChatConversaciones│
                    │  (Comentarios)  │    │   (Chat)        │
                    └─────────────────┘    └─────────────────┘
                                                       │
                                           ┌─────────────────┐
                                           │  ChatMensajes   │
                                           │   (Mensajes)    │
                                           └─────────────────┘
                                                       │
                                           ┌─────────────────┐
                                           │   PazYSalvos    │
                                           │  (Documentos)   │
                                           └─────────────────┘
```

### **Tablas Principales**

#### **AuthUsers** - Usuarios del Sistema
```sql
- Id (PK)
- Username (Unique)
- PasswordHash
- PasswordSalt
- Role (admin, soporte, usuario)
- IsActive
- PreferenciasJson
- SignaturePath
- CreatedAt
- LastLoginAt
```

#### **NominaUsuarios** - Usuarios de Nómina
```sql
- Id (PK)
- Nombre
- Apellido
- Rut (Unique)
- Email
- Departamento
- Empresa
- Ubicacion
```

#### **Activos** - Inventario de Activos
```sql
- Id (PK)
- Categoria (Equipos, Móviles, Monitores, etc.)
- Codigo (Unique)
- Estado (Nuevo, Usado, En Mantenimiento, Dado de Baja)
- Ubicacion
- Empresa
- NombreEquipo
- TipoEquipo (Desktop, Laptop, etc.)
- Procesador
- SistemaOperativo
- Serie
- Ram
- Marca
- Modelo
- DiscosJson
- Pulgadas (Monitores)
- Imei (Móviles)
- Capacidad (Móviles)
- NumeroCelular (Móviles)
- Nombre (Otros activos)
- Cantidad
- RustDeskId (NUEVO - ID de RustDesk)
```

#### **AsignacionesActivos** - Relación Usuario-Activo
```sql
- Id (PK)
- ActivoId (FK -> Activos)
- UsuarioId (FK -> NominaUsuarios)
- FechaAsignacion
- Estado (Activa, Devuelta, Perdida)
- Observaciones
- AsignadoPor
```

#### **Tickets** - Sistema de Soporte
```sql
- Id (PK)
- Titulo
- Descripcion
- NombreSolicitante
- EmailSolicitante
- TelefonoSolicitante
- Empresa
- Departamento
- Categoria (Hardware, Software, Red, Otros)
- Prioridad (Baja, Media, Alta, Crítica)
- Estado (Pendiente, Asignado, En Proceso, Resuelto, Cerrado)
- FechaCreacion
- ActivoId (FK -> Activos)
- CreadoPorId (FK -> AuthUsers)
```

#### **Actas** - Documentos de Entrega (Actualizado)
```sql
- Id (PK)
- AsignacionId (FK -> AsignacionesActivos)
- Estado (Pendiente, Pendiente_de_aprobacion, Firmada, Aprobada, Rechazada, Anulada)
- MetodoFirma (Pendiente, Digital, PDF_Subido, Admin_Subida)
- NombreArchivo
- RutaArchivo
- Observaciones (incluye hash SHA256)
- FechaCreacion
- FechaSubida
- AprobadoPorId (FK -> AuthUsers)
 - FechaFirma
 - FechaAprobacion
```

#### **ChatConversaciones** - Conversaciones de Chat (NUEVO)
```sql
- Id (PK)
- Titulo
- Descripcion
- Estado (Activa, Cerrada, Pendiente)
- FechaCreacion
- CreadoPorId (FK -> AuthUsers)
- Archivada (NUEVO - boolean)
```

#### **ChatMensajes** - Mensajes de Chat (NUEVO)
```sql
- Id (PK)
- ConversacionId (FK -> ChatConversaciones)
- Contenido
- CreadoPorId (FK -> AuthUsers)
- FechaCreacion
- Leido (NUEVO - boolean)
- EsMensajeChat (NUEVO - boolean)
```

#### **PazYSalvos** - Documentos de Paz y Salvo (NUEVO)
```sql
- Id (PK)
- UsuarioId (FK -> NominaUsuarios)
- UsuarioNombre
- ArchivoPath
- Estado (Pendiente, Aprobado, Rechazado)
- ActivosPendientes
- Notas
- FechaCreacion
- FechaSubida
```

---

## 🔧 API Backend

### **Estructura de Controladores**

#### **AuthController** - Autenticación
```csharp
POST /api/auth/login          // Login de usuario
POST /api/auth/register       // Registro de usuario
POST /api/auth/logout         // Logout
GET  /api/auth/profile        // Obtener perfil
PUT  /api/auth/profile        // Actualizar perfil
POST /api/auth/upload-signature // Subir firma
```

#### **CalendarEvents** - Eventos de Calendario (NUEVO)
```sql
- Id (PK)
- Title
- Description
- Start (datetimeoffset)
- End (datetimeoffset)
- AllDay (bit)
- Color (nvarchar)
- CreatedById (FK -> AuthUsers)
- CreatedAt (datetimeoffset)
```

#### **CalendarEventAssignees** - Relación Evento-Asignados (NUEVO)
```sql
- EventId (PK, FK -> CalendarEvents)
- UserId (PK, FK -> AuthUsers)
```

#### **UsuariosController** - Gestión de Usuarios
```csharp
GET    /api/usuarios          // Listar usuarios
GET    /api/usuarios/{id}     // Obtener usuario
POST   /api/usuarios          // Crear usuario
PUT    /api/usuarios/{id}     // Actualizar usuario
DELETE /api/usuarios/{id}     // Eliminar usuario
GET    /api/usuarios/search   // Búsqueda de usuarios
```

#### **ActivosController** - Gestión de Activos
```csharp
GET    /api/activos           // Listar activos
GET    /api/activos/{id}      // Obtener activo
POST   /api/activos           // Crear activo
PUT    /api/activos/{id}      // Actualizar activo
DELETE /api/activos/{id}      // Eliminar activo
GET    /api/activos/search    // Búsqueda de activos
POST   /api/activos/assign    // Asignar activo
POST   /api/activos/return    // Devolver activo
PATCH  /api/activos/{id}/rustdesk-id // Actualizar RustDesk ID (NUEVO)
```

#### **TicketsController** - Sistema de Tickets
```csharp
GET    /api/tickets           // Listar tickets
GET    /api/tickets/{id}      // Obtener ticket
POST   /api/tickets           // Crear ticket
PUT    /api/tickets/{id}      // Actualizar ticket
DELETE /api/tickets/{id}      // Eliminar ticket
POST   /api/tickets/{id}/comments // Agregar comentario
```

#### **ChatController** - Sistema de Chat (NUEVO)
```csharp
[Authorize]  // ← REQUERIDO para autenticación JWT
GET    /api/chat/conversaciones           // Listar conversaciones
GET    /api/chat/conversaciones/archivadas // Conversaciones archivadas
GET    /api/chat/conversaciones/{id}      // Obtener conversación
POST   /api/chat/conversaciones           // Crear conversación
PUT    /api/chat/conversaciones/{id}/archivar // Archivar conversación
PUT    /api/chat/conversaciones/{id}/desarchivar // Desarchivar conversación
DELETE /api/chat/conversaciones/{id}      // Eliminar conversación
POST   /api/chat/conversaciones/{id}/mensajes // Enviar mensaje
DELETE /api/chat/mensajes/{id}            // Eliminar mensaje
POST   /api/chat/{id}/marcar-leidos       // Marcar mensajes como leídos
```

#### **PazYSalvoController** - Sistema de Paz y Salvo (NUEVO)
```csharp
GET    /api/pazysalvo                    // Listar documentos
GET    /api/pazysalvo/{id}               // Obtener documento
POST   /api/pazysalvo                    // Crear documento
PUT    /api/pazysalvo/{id}               // Actualizar documento
DELETE /api/pazysalvo/{id}               // Eliminar documento
GET    /api/pazysalvo/{id}/download      // Descargar archivo
GET    /api/pazysalvo/activos-pendientes/{usuarioId} // Activos pendientes
```

#### **ActasController** - Gestión de Actas (Actualizado)
```csharp
POST   /api/actas/generar                      // Generar acta (admin/soporte)
POST   /api/actas/firmar-digital               // Firma digital (usuario)
POST   /api/actas/subir-pdf                    // Subir PDF (usuario)
POST   /api/actas/subir-admin                  // Subir PDF (admin/soporte)
POST   /api/actas/{id}/aprobar                 // Aprobar (admin/soporte)
POST   /api/actas/{id}/rechazar                // Rechazar (admin/soporte)
POST   /api/actas/{id}/pendiente               // Marcar pendiente (admin/soporte)
POST   /api/actas/{id}/upload-pdf-ti           // Subir PDF TI (admin/soporte)
POST   /api/actas/{id}/anular                  // Anular (admin/soporte)
GET    /api/actas/{id}/preview-auto            // Previsualización inteligente
```
### 📄 PDF, Almacenamiento y Versionado (Actas)

1) Carpeta de destino: `Storage/actas/<Categoria>` (fuera de `wwwroot`).
2) Logo en encabezado: el servicio intenta `public/logo.png` (fallback interno si aplica).
3) Nombre legible: `Acta de entrega - Nombre Apellido dd de mes de yyyy`.
4) Versionado: si existe el archivo, se generan `v1`, `v2`, ... (`GetNextVersionedFileName`).
5) Hash: se calcula SHA256 del PDF y se registra en `Observaciones`.
6) Previsualización: endpoint `preview-auto` prioriza `PDF_Usuario > PDF_Admin > Digital_Signed > Plantilla`.

### 🔔 Notificaciones (Resumen técnico)

- Persistentes en BD (`Notificaciones`) y SignalR para push en tiempo real.
- Grupos: `user_{userId}` y `role_{role}`.
- Eventos: firma usuario, subida PDF, aprobación, rechazo, marcado pendiente, subida TI, asignación/devolución de activo (mapeo Nómina→AuthUser), asignación y cambio de estado de ticket (mapeo Email→AuthUser), nuevo comentario en ticket.
  - (Nuevo) Asignación/actualización de evento de calendario → destinatarios: cada `AuthUser` en `CalendarEventAssignees`
- Endpoints: `GET /notifications`, `POST /notifications/read`, `DELETE /notifications/{id}`, `DELETE /notifications` (borrar todas), `GET /notifications/unread-count` (opcional).

#### **DashboardController** - Dashboard y Reportes
```csharp
GET    /api/dashboard/stats    // Estadísticas generales
GET    /api/dashboard/activos  // Estadísticas de activos
GET    /api/dashboard/tickets  // Estadísticas de tickets
GET    /api/dashboard/usuarios // Estadísticas de usuarios
POST   /api/dashboard/poblar-bd // Poblar base de datos
```

### **SignalR Hubs**

#### **ChatHub** - Chat en Tiempo Real (NUEVO)
```csharp
// Métodos del Hub
ReceiveChatMessage(conversacionId, mensaje)     // Recibir mensaje
ReceiveNewConversation(conversacion)            // Nueva conversación
UserConnected(userId)                           // Usuario conectado
UserDisconnected(userId)                        // Usuario desconectado

// Grupos
user_{userId}                                   // Grupo por usuario
role_{role}                                     // Grupo por rol
```

---

## ⚛️ Frontend React

### **Estructura de Componentes**

#### **Componentes Principales**
```
src/
├── components/
│   ├── DataTable.jsx              // Tabla de datos reutilizable
│   ├── Header.jsx                 // Encabezado de la aplicación
│   ├── Sidebar.jsx                // Barra lateral de navegación
│   ├── FloatingChatIcon.jsx       // Icono flotante de chat (NUEVO)
│   ├── RemoteControlButton.jsx    // Botón de control remoto (NUEVO)
│   ├── RustDeskModal.jsx          // Modal de configuración RustDesk (NUEVO)
│   ├── PazYSalvoManager.jsx       // Gestor de paz y salvo (NUEVO)
│   └── ...
├── pages/
│   ├── Dashboard.jsx              // Página principal
│   ├── Activos.jsx                // Gestión de activos
│   ├── Usuarios.jsx               // Gestión de usuarios
│   ├── Tickets.jsx                // Sistema de tickets
│   ├── Chat.jsx                   // Chat principal (NUEVO)
│   ├── PazYSalvo.jsx              // Página de paz y salvo (NUEVO)
│   └── ...
├── hooks/
│   ├── useChatSignalR.js          // Hook para SignalR (NUEVO)
│   ├── useResponsiveSidebar.js    // Hook para sidebar responsivo (NUEVO)
│   └── useWindowSize.js           // Hook para tamaño de ventana
├── contexts/
│   ├── AuthContext.jsx            // Contexto de autenticación
│   ├── NotificationContext.jsx    // Contexto de notificaciones
│   ├── SearchContext.jsx          // Contexto de búsqueda
│   └── ThemeContext.jsx           // Contexto de tema
└── services/
    └── api.js                     // Servicios de API
```

### **Hooks Personalizados**

#### **useChatSignalR** - Chat en Tiempo Real (NUEVO)
```javascript
const {
  connection,
  onMessageReceived,
  onConversationReceived,
  isConnected
} = useChatSignalR();

// Funcionalidades:
// - Conexión automática a SignalR
// - Reconexión automática
// - Escucha de mensajes en tiempo real
// - Escucha de nuevas conversaciones
```

#### **useResponsiveSidebar** - Sidebar Responsivo (NUEVO)
```javascript
const { isSidebarOpen, setIsSidebarOpen } = useResponsiveSidebar();

// Funcionalidades:
// - Cierre automático en pantallas pequeñas
// - Apertura automática en pantallas grandes
// - Gestión del estado del sidebar
```

### **Servicios API**

#### **api.js** - Servicios Centralizados
```javascript
// Activos API
activosAPI.updateRustDeskId(id, rustDeskId)     // Actualizar ID RustDesk

// Chat API
chatAPI.getConversaciones()                     // Obtener conversaciones
chatAPI.getConversacionesArchivadas()           // Conversaciones archivadas
chatAPI.archivarConversacion(id)                // Archivar conversación
chatAPI.desarchivarConversacion(id)             // Desarchivar conversación
chatAPI.eliminarConversacion(id)                // Eliminar conversación
chatAPI.eliminarMensaje(id)                     // Eliminar mensaje
chatAPI.marcarMensajesComoLeidos(id)            // Marcar como leídos

// Paz y Salvo API
pazYSalvoAPI.getAll()                           // Listar documentos
pazYSalvoAPI.create(data)                       // Crear documento
pazYSalvoAPI.update(id, data)                   // Actualizar documento
pazYSalvoAPI.delete(id)                         // Eliminar documento
pazYSalvoAPI.download(id)                       // Descargar archivo
pazYSalvoAPI.getActivosPendientes(usuarioId)    // Activos pendientes

// Calendario API (NUEVO)
calendarioAPI.getEvents()                       // Listar eventos (incluye asignados)
calendarioAPI.create(data)                      // Crear evento (assigneeAuthIds)
calendarioAPI.getById(id)                       // Obtener detalle
calendarioAPI.update(id, data)                  // Actualizar evento
calendarioAPI.remove(id)                        // Eliminar evento
```

---

## 🔐 Autenticación y Seguridad

### **JWT Authentication**
```csharp
// Configuración JWT
{
  "JwtSettings": {
    "SecretKey": "tu_clave_secreta_muy_larga",
    "Issuer": "PortalTI",
    "Audience": "PortalTIUsers",
    "ExpirationHours": 24
  }
}

// Estructura del Token
{
  "sub": "userId",
  "role": "admin|soporte|usuario",
  "username": "username",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### **Autorización por Roles**
```csharp
[Authorize(Roles = "admin")]           // Solo administradores
[Authorize(Roles = "admin,soporte")]   // Admin y soporte
[Authorize]                            // Usuarios autenticados
```

### **Validación de Datos**
- **FluentValidation**: Validación en el backend
- **React Hook Form**: Validación en el frontend
- **Sanitización**: Prevención de XSS
- **CSRF Protection**: Protección contra ataques CSRF

---

## 🖥️ Integración RustDesk

### **Arquitectura de Integración**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   RustDesk      │
│   React         │◄──►│   API           │    │   Local API     │
│                 │    │                 │    │   (Puerto 21117)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Funcionalidades Implementadas**

#### **1. Persistencia de IDs**
```csharp
// Modelo Activo
public class Activo
{
    // ... otras propiedades
    public string? RustDeskId { get; set; }
}

// API Endpoint
PATCH /api/activos/{id}/rustdesk-id
{
    "rustDeskId": "12345678901234567890"
}
```

#### **2. Filtrado Inteligente**
```javascript
// Solo equipos compatibles con RustDesk
const equiposRustDesk = activosAsignados.filter(activo => 
    ['Equipos', 'Equipo'].includes(activo.Categoria)
);
```

#### **3. Modal de Asistencia**
```javascript
// Componente RustDeskModal
- Descarga directa de rustdesk.exe
- Instrucciones paso a paso
- Captura manual de ID y contraseña
- Envío de credenciales por chat
```

#### **4. API Local de RustDesk**
```javascript
// Intentos de captura automática
const rustDeskAPI = {
    baseURL: 'http://localhost:21117',
    endpoints: {
        getID: '/api/get_id',
        getPassword: '/api/get_password'
    }
};
```

### **Flujo de Trabajo**
1. **Usuario solicita control remoto**
2. **Sistema filtra equipos compatibles**
3. **Se muestra modal de asistencia**
4. **Usuario descarga/instala RustDesk**
5. **Usuario ingresa ID manualmente**
6. **Credenciales se envían por chat**
7. **Admin/soporte puede conectar**

---

## 💬 Sistema de Chat en Tiempo Real

### **Arquitectura SignalR**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cliente 1     │    │   SignalR Hub   │    │   Cliente 2     │
│   (Usuario)     │◄──►│   (ChatHub)     │◄──►│   (Soporte)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Base de       │
                    │   Datos         │
                    │   (SQL Server)  │
                    └─────────────────┘
```

### **Componentes del Sistema**

#### **1. ChatHub (Backend)**
```csharp
public class ChatHub : Hub
{
    // Gestión de conexiones
    public override async Task OnConnectedAsync()
    public override async Task OnDisconnectedAsync(Exception exception)
    
    // Grupos de usuarios
    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
    
    // Envío de mensajes
    await Clients.Group($"user_{userId}").SendAsync("ReceiveChatMessage", conversacionId, mensaje);
}
```

#### **2. useChatSignalR (Frontend)**
```javascript
const useChatSignalR = () => {
    // Conexión automática
    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl("/hubs/chat", { accessTokenFactory: () => token })
            .build();
            
        // Reconexión automática
        connection.onclose(() => {
            setTimeout(() => connection.start(), 5000);
        });
    }, []);
    
    // Escucha de mensajes
    connection.on("ReceiveChatMessage", (conversacionId, mensaje) => {
        // Actualizar estado del chat
            });
        };
```

#### **3. FloatingChatIcon**
```javascript
// Icono flotante con contador
const FloatingChatIcon = () => {
    const [totalNoLeidos, setTotalNoLeidos] = useState(0);
    
    // Actualización automática del contador
    useEffect(() => {
        // Cargar conversaciones y calcular no leídos
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-[9999]">
            <button onClick={toggleChat}>
                <span className="badge">{totalNoLeidos}</span>
            </button>
        </div>
    );
};
```

### **Funcionalidades del Chat**

#### **1. Conversaciones Archivadas**
```javascript
// Tabs para conversaciones activas y archivadas
const [activeTab, setActiveTab] = useState('activas');

// Filtrado de conversaciones
const conversacionesActivas = conversaciones.filter(c => !c.archivada);
const conversacionesArchivadas = conversaciones.filter(c => c.archivada);
```

#### **2. Eliminación de Mensajes**
```javascript
// Solo admin y soporte pueden eliminar
const canDeleteMessage = userRole === 'admin' || userRole === 'soporte';

const eliminarMensaje = async (mensajeId) => {
    if (!canDeleteMessage) return;
    await chatAPI.eliminarMensaje(mensajeId);
};
```

#### **3. Estados de Usuario**
```javascript
// Indicador online/offline
const UserStatus = ({ userId }) => {
    const [isOnline, setIsOnline] = useState(false);
    
    useEffect(() => {
        // Verificar estado del usuario
        const checkStatus = async () => {
            const status = await ChatHub.IsUserOnline(userId);
            setIsOnline(status);
        };
    }, [userId]);
    
    return (
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢' : '🔴'}
        </div>
    );
};
```

---

## 📄 Sistema de Paz y Salvo

### **Arquitectura del Sistema**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Sistema de    │
│   React         │◄──►│   API           │    │   Archivos      │
│                 │    │                 │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Modelo de Datos**
```csharp
public class PazYSalvo
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string UsuarioNombre { get; set; }
    public string ArchivoPath { get; set; }
    public string Estado { get; set; } // Pendiente, Aprobado, Rechazado
    public string ActivosPendientes { get; set; }
    public string Notas { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaSubida { get; set; }
    
    // Relaciones
    public virtual NominaUsuario Usuario { get; set; }
}
```

### **Gestión de Archivos**
```csharp
// Subida de archivos
public async Task<IActionResult> Create([FromForm] PazYSalvoCreateDto dto)
{
    var fileName = $"{Guid.NewGuid()}_{dto.Archivo.FileName}";
    var filePath = Path.Combine(_storageRoot, "pazysalvo", fileName);
    
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await dto.Archivo.CopyToAsync(stream);
    }
    
    // Guardar en base de datos
    var pazYSalvo = new PazYSalvo
    {
        UsuarioId = dto.UsuarioId,
        ArchivoPath = fileName,
        Estado = "Pendiente"
    };
}

// Descarga de archivos
public async Task<IActionResult> Download(int id)
{
    var pazYSalvo = await _db.PazYSalvos.FindAsync(id);
    var filePath = Path.Combine(_storageRoot, "pazysalvo", pazYSalvo.ArchivoPath);
    
    var memory = new MemoryStream();
    using (var stream = new FileStream(filePath, FileMode.Open))
    {
        await stream.CopyToAsync(memory);
    }
    
    return File(memory.ToArray(), "application/octet-stream", pazYSalvo.ArchivoPath);
}
```

### **Validación de Activos Pendientes**
```csharp
// Obtener activos pendientes por usuario
public async Task<IActionResult> GetActivosPendientes(int usuarioId)
{
    var activosPendientes = await _db.AsignacionesActivos
        .Include(aa => aa.Activo)
        .Where(aa => aa.UsuarioId == usuarioId && 
                    aa.Estado == "Activa" &&
                    aa.Activo.Estado != "Dado de Baja")
        .Select(aa => new
        {
            aa.Activo.Codigo,
            aa.Activo.Categoria,
            aa.Activo.NombreEquipo,
            aa.FechaAsignacion
        })
        .ToListAsync();
        
    return Ok(activosPendientes);
}
```

---

## 🗓️ Calendario de TI

### **Modelos y Relaciones (Backend)**
```csharp
public class CalendarEvent
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset End { get; set; }
    public bool AllDay { get; set; }
    public string? Color { get; set; }
    public int CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<CalendarEventAssignee> Assignees { get; set; } = new List<CalendarEventAssignee>();
}

public class CalendarEventAssignee
{
    public int EventId { get; set; }
    public int UserId { get; set; } // AuthUser.Id
    public CalendarEvent Event { get; set; } = null!;
    public AuthUser User { get; set; } = null!;
}
```

### **DbContext y Configuración**
```csharp
// PortalTiContext.cs (OnModelCreating)
modelBuilder.Entity<CalendarEventAssignee>()
    .HasKey(ea => new { ea.EventId, ea.UserId });
modelBuilder.Entity<CalendarEventAssignee>()
    .HasOne(ea => ea.Event)
    .WithMany(e => e.Assignees)
    .HasForeignKey(ea => ea.EventId);
modelBuilder.Entity<CalendarEventAssignee>()
    .HasOne(ea => ea.User)
    .WithMany()
    .HasForeignKey(ea => ea.UserId);
```

### **Endpoints (Backend)**
```http
GET    /api/calendario/events                   // Listar (admin/soporte). Incluye Assignees
GET    /api/calendario/events/{id}              // Detalle
POST   /api/calendario/events                   // Crear { title, description, start, end, allDay, color, assigneeAuthIds[] }
PUT    /api/calendario/events/{id}              // Actualizar (mismo DTO)
DELETE /api/calendario/events/{id}              // Eliminar
```

Notas:
- Autorización: `[Authorize(Roles = "admin,soporte")]`
- Notificaciones: en Create/Update se notifica a `assigneeAuthIds` usando `INotificationsService`

### **Frontend (Calendario.jsx)**
```jsx
// FullCalendar: dayGrid, timeGrid, interaction, locale ES
// Modal de creación/edición: título, descripción, color, fechas auto 09:00–18:00
// Asignados: UserAutoComplete con lista de AuthUsers (roles admin/soporte)
// Detalle: ver información, botones Editar y Eliminar (confirmación)
// Tema: estilos adaptativos a dark/light con Tailwind sobre clases de FullCalendar
// CSS: se carga vía CDN en public/index.html debido a exports de CSS en v6
```

### **Selección de Usuarios Asignables**
- Backend `AuthController.GetUsuarios`: devuelve solo `admin/soporte` activos con `authId` (AuthUser.Id), nombre, email, departamento
- Frontend: usa `UserAutoComplete` para búsqueda y selección múltiple; envía `assigneeAuthIds`

### **Reglas UX de Fechas**
- Selección de un día: 09:00–18:00 del mismo día
- Selección de varios días: inicio 09:00 del primer día, fin 18:00 del último día

### **Notificaciones de Calendario**
- Mensajes: "Nuevo evento asignado" (create), "Evento actualizado" (update)
- Receptor: cada usuario en `assigneeAuthIds`
- UI: aparece en campana y persiste en BD

### **Sidebar**
- Nueva entrada `Calendario` visible para `admin/soporte` con icono `Calendar`
- Cambio de icono de "Paz y Salvo" a `BadgeCheck` para evitar duplicidad

---

## 🎨 Mejoras de UI/UX

### **Diseño Responsivo**
```css
/* Botones estéticos */
.btn-primary {
    @apply bg-gradient-to-r from-purple-600 to-blue-600 
           hover:from-purple-700 hover:to-blue-700
           text-white font-medium py-2 px-4 rounded-lg
           shadow-lg hover:shadow-xl transform hover:scale-105
           transition-all duration-200;
}

/* Sidebar responsivo */
.sidebar {
    @apply lg:w-64 md:w-48 sm:w-48
           transition-all duration-300 ease-in-out;
}

/* Icono flotante */
.floating-icon {
    @apply fixed bottom-4 right-4 z-[9999]
           bg-gradient-to-r from-purple-600 to-blue-600
           text-white rounded-full p-3 shadow-lg
           hover:shadow-xl transform hover:scale-110
           transition-all duration-200;
}
```

### **Animaciones y Transiciones**
```javascript
// Transiciones suaves
const AnimatedWrapper = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
    >
        {children}
    </motion.div>
);

// Feedback visual
const Toast = ({ message, type }) => (
    <div className={`toast toast-${type}`}>
        <div className="animate-bounce">🎉</div>
        <span>{message}</span>
    </div>
);
```

### **Optimizaciones de Rendimiento**
```javascript
// Memoización de componentes
const ExpensiveComponent = React.memo(({ data }) => {
    return <div>{/* Renderizado costoso */}</div>;
});

// Debouncing para búsquedas
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => clearTimeout(handler);
    }, [value, delay]);
    
    return debouncedValue;
};
```

---

## 🚀 Configuración y Despliegue

### **Variables de Entorno**
```env
# Frontend (.env)
REACT_APP_API_URL=http://localhost:5266
REACT_APP_ENVIRONMENT=development

# Backend (appsettings.json)
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PortalTi;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "JwtSettings": {
    "SecretKey": "tu_clave_secreta_muy_larga",
    "Issuer": "PortalTI",
    "Audience": "PortalTIUsers",
    "ExpirationHours": 24
  }
}
```

### **Migraciones de Base de Datos**
```bash
# Opción 1: Migraciones automáticas (recomendado)
# El backend aplica migraciones automáticamente al iniciar

# Opción 2: Script completo de base de datos
# Ejecutar el script SQL completo para crear toda la BD desde cero
sqlcmd -S localhost -i CREAR_BD_COMPLETA.sql

# Opción 3: Migraciones manuales
dotnet ef migrations add NombreMigracion
dotnet ef database update

# Revertir migración
dotnet ef database update NombreMigracionAnterior

# Crear usuario admin inicial
sqlcmd -S localhost -i CREAR_ADMIN.sql
```

### **Despliegue en Producción**
```bash
# Frontend
npm run build
# Servir archivos estáticos con nginx/apache

# Backend
dotnet publish -c Release
# Desplegar en IIS o Azure

# Base de datos
# SQL Server en servidor dedicado
```

---

## 🧪 Guías de Desarrollo

### **Scripts de Base de Datos Disponibles**
- **`CREAR_BD_COMPLETA.sql`**: Script completo para crear toda la base de datos desde cero
  - Incluye todas las tablas, relaciones, índices y constraints
  - Resuelve problemas de foreign key constraints con `ON DELETE NO ACTION`
  - Incluye índices optimizados para rendimiento
- **`CREAR_ADMIN.sql`**: Script para crear el usuario admin inicial
  - Username: `admin`
  - Password: `admin`
  - Hash HMACSHA512 generado correctamente
- **`POBLAR_BD.sql`**: Script para poblar la base de datos con datos de prueba

### **Agregar Nueva Funcionalidad**
1. **Crear modelo** en `Models/`
2. **Crear migración** con `dotnet ef migrations add`
3. **Crear controlador** en `Controllers/`
4. **Agregar `[Authorize]`** si requiere autenticación
5. **Crear componente** en `src/components/`
6. **Crear página** en `src/pages/`
7. **Agregar rutas** en `App.js`
8. **Actualizar documentación**

### **Estándares de Código**
```csharp
// Backend - C#
[ApiController]
[Route("api/[controller]")]
[Authorize]  // ← REQUERIDO para autenticación JWT
public class MiController : ControllerBase
{
    private readonly ILogger<MiController> _logger;
    private readonly PortalTiContext _db;
    
    public MiController(ILogger<MiController> logger, PortalTiContext db)
    {
        _logger = logger;
        _db = db;
    }
    
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var result = await _db.MiEntidad.ToListAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener datos");
            return StatusCode(500, "Error interno del servidor");
        }
    }
}
```

```javascript
// Frontend - React
const MiComponente = ({ data, onAction }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleAction = async () => {
        try {
            setLoading(true);
            setError(null);
            await onAction();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="mi-componente">
            {loading && <div className="loading">Cargando...</div>}
            {error && <div className="error">{error}</div>}
            {/* Contenido del componente */}
        </div>
    );
};
```

### **Testing**
```javascript
// Frontend - Jest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import MiComponente from './MiComponente';

test('renders correctly', () => {
    render(<MiComponente data={[]} />);
    expect(screen.getByText('Mi Componente')).toBeInTheDocument();
});

test('handles action correctly', async () => {
    const mockAction = jest.fn();
    render(<MiComponente onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Acción'));
    expect(mockAction).toHaveBeenCalled();
});
```

```csharp
// Backend - xUnit
[Fact]
public async Task Get_ReturnsOkResult()
{
    // Arrange
    var controller = new MiController(_logger, _db);
    
    // Act
    var result = await controller.Get();
    
    // Assert
    Assert.IsType<OkObjectResult>(result);
}
```

---

## 📚 Recursos Adicionales

### **Documentación Externa**
- **[React Documentation](https://react.dev/)**
- **[ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)**
- **[Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)**
- **[SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)**
- **[Tailwind CSS](https://tailwindcss.com/docs)**
- **[RustDesk Documentation](https://rustdesk.com/docs/)**

### **Herramientas de Desarrollo**
- **Visual Studio 2022**: IDE principal para .NET
- **VS Code**: Editor para React
- **SQL Server Management Studio**: Gestión de base de datos
- **Postman**: Testing de APIs
- **Chrome DevTools**: Debugging de frontend

### **Librerías Principales**
- **Frontend**: React, React Router, Tailwind CSS, Axios, SignalR Client
- **Backend**: ASP.NET Core, Entity Framework Core, SignalR, JWT
- **Base de Datos**: SQL Server
- **Herramientas**: AutoMapper, FluentValidation, Serilog

---

## 🔧 Solución de Problemas Comunes

### **Error 404 en Chat de Conversaciones**
**Problema**: El endpoint `/api/chat/conversaciones` devuelve 404
**Causa**: El `ChatController` no tenía el atributo `[Authorize]`
**Solución**: Agregar `[Authorize]` al controlador y reiniciar el backend

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]  // ← AGREGAR ESTA LÍNEA
public class ChatController : ControllerBase
```

### **Error de Foreign Key Constraints**
**Problema**: "Introducing FOREIGN KEY constraint may cause cycles or multiple cascade paths"
**Causa**: Múltiples rutas de cascada en las relaciones
**Solución**: Usar `ON DELETE NO ACTION` en lugar de `ON DELETE CASCADE`

### **Error de Login con Admin**
**Problema**: No se puede hacer login con el usuario admin
**Causa**: Hash de contraseña incorrecto en la base de datos
**Solución**: Usar el script `CREAR_ADMIN.sql` con hash HMACSHA512 correcto

---

**PortalTI** - Documentación Técnica Completa
*Última actualización: Septiembre 2025*
