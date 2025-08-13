# 📚 Documentación Técnica - PortalTI

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Base de Datos](#base-de-datos)
3. [API Backend](#api-backend)
4. [Frontend React](#frontend-react)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Guías de Desarrollo](#guías-de-desarrollo)

---

## 🏗️ Arquitectura del Sistema

### **Arquitectura General**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   React         │◄──►│   ASP.NET Core  │◄──►│   Datos         │
│                 │    │   API           │    │   SQL Server    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Stack Tecnológico**
- **Frontend**: React 18 + Tailwind CSS + React Router
- **Backend**: ASP.NET Core 8 + Entity Framework Core
- **Base de Datos**: SQL Server 2019+
- **Autenticación**: JWT Bearer Tokens
- **Comunicación**: REST API + SignalR (para chat)

---

## 🗄️ Base de Datos

### **Diagrama ER**
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

#### **Actas** - Documentos de Entrega
```sql
- Id (PK)
- AsignacionId (FK -> AsignacionesActivos)
- Estado (Pendiente, Firmada, Aprobada, Rechazada)
- MetodoFirma (Digital, PDF_Subido, Admin_Subida)
- FechaCreacion
- FechaSubida
- AprobadoPorId (FK -> AuthUsers)
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
```

#### **TicketsController** - Sistema de Tickets
```csharp
GET    /api/tickets           // Listar tickets
GET    /api/tickets/{id}      // Obtener ticket
POST   /api/tickets           // Crear ticket
PUT    /api/tickets/{id}      // Actualizar ticket
DELETE /api/tickets/{id}      // Eliminar ticket
GET    /api/tickets/my-tickets // Mis tickets
POST   /api/tickets/{id}/comments // Agregar comentario
```

#### **ActasController** - Gestión de Actas
```csharp
GET    /api/actas             // Listar actas
GET    /api/actas/{id}        // Obtener acta
POST   /api/actas             // Crear acta
PUT    /api/actas/{id}        // Actualizar acta
GET    /api/actas/{id}/pdf    // Generar PDF
POST   /api/actas/{id}/approve // Aprobar acta
```

#### **ChatController** - Chat de Soporte
```csharp
GET    /api/chat/conversations // Listar conversaciones
GET    /api/chat/{id}/messages // Obtener mensajes
POST   /api/chat/conversations // Crear conversación
POST   /api/chat/messages     // Enviar mensaje
PUT    /api/chat/messages/{id}/read // Marcar como leído
```

#### **DashboardController** - Dashboard y Reportes
```csharp
GET    /api/dashboard/stats   // Estadísticas generales
GET    /api/dashboard/charts  // Datos para gráficos
POST   /api/dashboard/seed-data // Poblar BD con datos de prueba
```

### **Modelos de Datos**

#### **DTOs (Data Transfer Objects)**
```csharp
// LoginRequest
public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}

// LoginResponse
public class LoginResponse
{
    public string Token { get; set; }
    public string Username { get; set; }
    public string Role { get; set; }
    public DateTime ExpiresAt { get; set; }
}

// ActivoDTO
public class ActivoDTO
{
    public int Id { get; set; }
    public string Categoria { get; set; }
    public string Codigo { get; set; }
    public string Estado { get; set; }
    public string Ubicacion { get; set; }
    public string Empresa { get; set; }
    public string Marca { get; set; }
    public string Modelo { get; set; }
    public string UsuarioAsignado { get; set; }
}
```

---

## ⚛️ Frontend React

### **Estructura de Componentes**

#### **Layout Components**
```
MainLayout.jsx          // Layout principal con sidebar
Header.jsx              // Header con navegación
Sidebar.jsx             // Menú lateral
Footer.jsx              // Footer
```

#### **Page Components**
```
Dashboard.jsx           // Dashboard principal
Login.jsx               // Página de login
Usuarios.jsx            // Lista de usuarios
UsuariosForm.jsx        // Formulario de usuario
Activos.jsx             // Lista de activos
ActivosForm.jsx         // Formulario de activo
ActivoDetail.jsx        // Detalle de activo
Tickets.jsx             // Lista de tickets
CrearTicket.jsx         // Crear ticket
TicketDetail.jsx        // Detalle de ticket
Actas.jsx               // Lista de actas
Chat.jsx                // Chat de soporte
Perfil.jsx              // Perfil de usuario
Ajustes.jsx             // Configuración
```

#### **Modal Components**
```
AsignarActivoModal.jsx  // Modal para asignar activo
GenerarActaModal.jsx    // Modal para generar acta
GenerarTicketModal.jsx  // Modal para generar ticket
ChatInternoModal.jsx    // Modal de chat interno
DeleteConfirmationModal.jsx // Modal de confirmación
```

#### **Utility Components**
```
DataTable.jsx           // Tabla de datos reutilizable
Toast.jsx               // Notificaciones toast
Tooltip.jsx             // Tooltips
AutoCompleteInput.jsx   // Input con autocompletado
LocationSelector.jsx    // Selector de ubicación
SignatureDrawer.jsx     // Dibujador de firmas
```

### **Contextos de React**

#### **AuthContext** - Gestión de Autenticación
```javascript
const AuthContext = createContext();

// Estado global
const [user, setUser] = useState(null);
const [token, setToken] = useState(localStorage.getItem('token'));
const [loading, setLoading] = useState(false);

// Funciones
const login = async (credentials) => { /* ... */ };
const logout = () => { /* ... */ };
const updateProfile = async (data) => { /* ... */ };
```

#### **ThemeContext** - Gestión de Temas
```javascript
const ThemeContext = createContext();

// Estado
const [theme, setTheme] = useState('light');

// Funciones
const toggleTheme = () => { /* ... */ };
const setDarkTheme = () => { /* ... */ };
const setLightTheme = () => { /* ... */ };
```

#### **NotificationContext** - Sistema de Notificaciones
```javascript
const NotificationContext = createContext();

// Estado
const [notifications, setNotifications] = useState([]);

// Funciones
const addNotification = (message, type) => { /* ... */ };
const removeNotification = (id) => { /* ... */ };
const clearNotifications = () => { /* ... */ };
```

### **Hooks Personalizados**

#### **useWindowSize** - Tamaño de Ventana
```javascript
const useWindowSize = () => {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return size;
};
```

### **Servicios API**

#### **api.js** - Cliente HTTP
```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5266/api',
    timeout: 10000
});

// Interceptor para agregar token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

---

## 🔐 Autenticación y Seguridad

### **Flujo de Autenticación JWT**

1. **Login**
   ```javascript
   // Frontend envía credenciales
   POST /api/auth/login
   {
     "username": "admin",
     "password": "password123"
   }
   ```

2. **Respuesta del Servidor**
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "username": "admin",
     "role": "admin",
     "expiresAt": "2024-01-15T10:30:00Z"
   }
   ```

3. **Almacenamiento del Token**
   ```javascript
   localStorage.setItem('token', response.data.token);
   ```

4. **Uso en Requests**
   ```javascript
   // Automáticamente agregado por interceptor
   headers: {
     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   }
   ```

### **Autorización por Roles**

#### **Roles Disponibles**
- **admin**: Acceso completo al sistema
- **soporte**: Gestión de activos, tickets y chat
- **usuario**: Acceso limitado a funcionalidades básicas

#### **Middleware de Autorización**
```csharp
[Authorize(Roles = "admin")]
[Authorize(Roles = "admin,soporte")]
[Authorize(Roles = "admin,soporte,usuario")]
```

### **Validación de Datos**

#### **FluentValidation**
```csharp
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .Length(3, 50);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(6);
    }
}
```

---

## 📋 Funcionalidades por Módulo

### **1. Módulo de Usuarios**

#### **Gestión de Usuarios de Nómina**
- ✅ Crear, editar, eliminar usuarios
- ✅ Búsqueda y filtros avanzados
- ✅ Asignación de departamentos y empresas
- ✅ Gestión de ubicaciones

#### **Gestión de Usuarios del Sistema**
- ✅ Crear cuentas de acceso
- ✅ Asignación de roles
- ✅ Gestión de firmas digitales
- ✅ Configuración de preferencias

#### **Perfil de Usuario**
- ✅ Edición de información personal
- ✅ Cambio de contraseña
- ✅ Subida de firma digital
- ✅ Configuración de tema

### **2. Módulo de Activos**

#### **Gestión de Inventario**
- ✅ Registro de activos por categoría
- ✅ Especificaciones técnicas detalladas
- ✅ Estados de activos (Nuevo, Usado, etc.)
- ✅ Ubicaciones y empresas

#### **Asignación de Activos**
- ✅ Asignar activos a usuarios
- ✅ Historial de asignaciones
- ✅ Devolución de activos
- ✅ Estados de asignación

#### **Categorías de Activos**
- **Equipos**: Desktop, Laptop, Servidor, Workstation
- **Móviles**: Smartphones, Tablets
- **Monitores**: Pantallas de diferentes tamaños
- **Periféricos**: Teclados, mouse, impresoras
- **Accesorios**: Cables, adaptadores, etc.
- **Red**: Switches, routers, puntos de acceso

### **3. Módulo de Tickets**

#### **Sistema de Soporte**
- ✅ Creación de tickets
- ✅ Asignación de prioridades
- ✅ Estados de seguimiento
- ✅ Comentarios internos y externos

#### **Categorías de Tickets**
- **Hardware**: Problemas con equipos físicos
- **Software**: Problemas con aplicaciones
- **Red**: Problemas de conectividad
- **Otros**: Otros tipos de problemas

#### **Prioridades**
- **Baja**: Problemas menores
- **Media**: Problemas moderados
- **Alta**: Problemas importantes
- **Crítica**: Problemas urgentes

### **4. Módulo de Actas**

#### **Gestión Documental**
- ✅ Generación automática de PDFs
- ✅ Múltiples métodos de firma
- ✅ Estados de aprobación
- ✅ Historial de cambios

#### **Métodos de Firma**
- **Digital**: Firma dibujada en pantalla
- **PDF_Subido**: Subida de PDF firmado
- **Admin_Subida**: Firma por administrador

### **5. Módulo de Chat**

#### **Chat de Soporte**
- ✅ Conversaciones en tiempo real
- ✅ Mensajes internos
- ✅ Generación de tickets desde chat
- ✅ Historial de conversaciones

#### **Estados de Conversación**
- **Activa**: Conversación en curso
- **Cerrada**: Conversación finalizada
- **Pendiente**: Esperando respuesta

### **6. Módulo de Dashboard**

#### **Métricas y Reportes**
- ✅ Estadísticas en tiempo real
- ✅ Gráficos interactivos
- ✅ Filtros por período
- ✅ KPIs personalizables

#### **Funcionalidades de Desarrollo**
- ✅ Botón para poblar BD con datos de prueba
- ✅ Preservación de usuarios admin
- ✅ Datos genéricos para testing

---

## ⚙️ Configuración y Despliegue

### **Variables de Entorno**

#### **Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5266
REACT_APP_ENVIRONMENT=development
```

#### **Backend (appsettings.json)**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PortalTi;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "JwtSettings": {
    "SecretKey": "tu_clave_secreta_muy_larga_y_segura",
    "Issuer": "PortalTI",
    "Audience": "PortalTIUsers",
    "ExpirationHours": 24
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### **Migraciones de Base de Datos**

#### **Comandos EF Core**
```bash
# Crear migración
dotnet ef migrations add NombreMigracion

# Aplicar migraciones
dotnet ef database update

# Revertir migración
dotnet ef database update NombreMigracionAnterior

# Generar script SQL
dotnet ef migrations script
```

#### **Scripts de Población**
- **POBLAR_BD.sql**: Script completo para poblar BD con datos genéricos
- **Preserva usuarios admin**: No elimina usuarios administradores existentes
- **Datos realistas**: 250 usuarios, 500 activos, tickets, actas, etc.

### **Despliegue en Producción**

#### **Frontend (Build)**
```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# Servir archivos estáticos
# nginx, apache, o servidor web
```

#### **Backend (Publish)**
```bash
# Publicar aplicación
dotnet publish -c Release -o ./publish

# Desplegar en IIS
# Copiar archivos a directorio web

# Desplegar en Azure
# Azure App Service o Azure Functions
```

#### **Base de Datos**
```bash
# SQL Server en servidor dedicado
# Configurar connection string
# Ejecutar migraciones
dotnet ef database update
```

---

## 🛠️ Guías de Desarrollo

### **Agregar Nueva Funcionalidad**

#### **1. Backend**
```bash
# 1. Crear modelo en Models/
# 2. Agregar DbSet en PortalTiContext
# 3. Crear migración
dotnet ef migrations add NuevaFuncionalidad
# 4. Crear controlador en Controllers/
# 5. Implementar endpoints
# 6. Agregar validaciones
# 7. Actualizar documentación
```

#### **2. Frontend**
```bash
# 1. Crear componente en components/
# 2. Crear página en pages/
# 3. Agregar ruta en App.js
# 4. Implementar servicios en api.js
# 5. Agregar al menú en Sidebar.jsx
# 6. Probar funcionalidad
```

### **Estructura de Commits**
```bash
# Formato: tipo(alcance): descripción
git commit -m "feat(usuarios): agregar validación de email único"
git commit -m "fix(activos): corregir error en asignación"
git commit -m "docs(readme): actualizar documentación"
git commit -m "style(ui): mejorar diseño del dashboard"
```

### **Testing**

#### **Frontend Testing**
```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage
```

#### **Backend Testing**
```bash
# Tests unitarios
dotnet test

# Tests de integración
dotnet test --filter Category=Integration

# Coverage
dotnet test --collect:"XPlat Code Coverage"
```

### **Debugging**

#### **Frontend**
```javascript
// Console logs
console.log('Debug info:', data);

// React DevTools
// Instalar extensión en navegador

// Network tab
// Revisar requests/responses
```

#### **Backend**
```csharp
// Logging
_logger.LogInformation("Debug info: {Data}", data);
_logger.LogError("Error occurred: {Error}", ex.Message);

// Debugger
Debugger.Break();

// Swagger UI
// http://localhost:5266/swagger
```

### **Performance**

#### **Frontend**
- ✅ Lazy loading de componentes
- ✅ Memoización con React.memo
- ✅ Optimización de re-renders
- ✅ Code splitting

#### **Backend**
- ✅ Paginación en listas
- ✅ Caching con Redis
- ✅ Optimización de queries EF
- ✅ Compresión de respuestas

---

## 📊 Métricas y Monitoreo

### **Logs del Sistema**
- **Serilog**: Logging estructurado
- **Niveles**: Debug, Information, Warning, Error
- **Destinos**: Console, File, Database

### **Métricas de Rendimiento**
- **Response Time**: Tiempo de respuesta de API
- **Throughput**: Requests por segundo
- **Error Rate**: Tasa de errores
- **Memory Usage**: Uso de memoria

### **Alertas**
- **Errores 500**: Errores del servidor
- **Timeout**: Requests que exceden límite
- **Memory**: Uso alto de memoria
- **Database**: Problemas de conexión

---

## 🔧 Mantenimiento

### **Backup de Base de Datos**
```sql
-- Backup completo
BACKUP DATABASE PortalTi TO DISK = 'C:\Backups\PortalTi.bak'

-- Backup diferencial
BACKUP DATABASE PortalTi TO DISK = 'C:\Backups\PortalTi_diff.bak' WITH DIFFERENTIAL

-- Restore
RESTORE DATABASE PortalTi FROM DISK = 'C:\Backups\PortalTi.bak'
```

### **Limpieza de Datos**
```sql
-- Limpiar logs antiguos
DELETE FROM UserActivityLogs WHERE Timestamp < DATEADD(MONTH, -6, GETDATE())

-- Limpiar notificaciones leídas
DELETE FROM Notificaciones WHERE Leida = 1 AND Fecha < DATEADD(MONTH, -1, GETDATE())
```

### **Actualizaciones**
```bash
# Frontend
npm update
npm audit fix

# Backend
dotnet add package NombrePaquete --version NuevaVersion
dotnet restore
dotnet build
```

---

## 📞 Soporte y Contacto

### **Canales de Soporte**
- **Email**: javier.rjorquera@gmail.com
- **Issues**: GitHub Issues
- **Documentación**: Este archivo

### **Recursos Adicionales**
- **API Documentation**: Swagger UI
- **Code Examples**: Repositorio GitHub
- **Troubleshooting**: Sección de debugging

---

*Esta documentación se actualiza regularmente. Última actualización: Agosto 2025*
