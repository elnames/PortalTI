---
layout: default
title: Documentación Principal
nav_order: 2
description: "Sistema Integral de Gestión de Activos y Necesidades Tecnológicas"
permalink: /docs/README/
---

# PortalTI - Sistema Integral de Gestión de Activos y Necesidades Tecnológicas

[← Volver al índice](../) | [Documentación Técnica →](./DOCUMENTACION_TECNICA.md)

## 📋 Descripción

PortalTI es una aplicación web moderna y completa para la gestión integral de activos tecnológicos, usuarios, tickets de soporte y documentación empresarial. Desarrollada con React 18 en el frontend y ASP.NET Core 8 en el backend, ofrece una solución robusta para empresas que requieren un control detallado de sus recursos tecnológicos.

## 🚀 Características Principales

### 👥 Gestión de Usuarios y Autenticación
- **Sistema de roles avanzado**: Admin, Soporte, Usuario con permisos granulares
- **Autenticación JWT**: Tokens seguros con renovación automática
- **Perfiles completos**: Información personal, laboral y preferencias
- **Gestión de firmas digitales**: Subida, previsualización y gestión de firmas
- **Logs de actividad**: Seguimiento completo de acciones de usuarios
- **Preferencias personalizables**: Configuración individual por usuario

### 💻 Gestión de Activos Tecnológicos
- **Categorización completa**: Equipos, Móviles, Monitores, Periféricos, Accesorios, Red
- **Información detallada**: Especificaciones técnicas, seriales, IMEI, capacidades
- **Estados dinámicos**: Disponible, Asignado, En Mantenimiento, Dado de Baja
- **Asignación inteligente**: Sistema de asignación con historial completo
- **Ubicaciones múltiples**: Oficinas centrales, sucursales y ubicaciones regionales
- **Empresas multi-tenant**: Soporte para múltiples empresas en un solo sistema
- **Sistema Operativo**: Registro del sistema operativo de cada equipo

### 🖥️ Control Remoto con RustDesk
- **Integración RustDesk**: Control remoto directo desde la aplicación
- **Persistencia de IDs**: Almacenamiento automático de IDs de RustDesk
- **Filtrado inteligente**: Solo equipos compatibles (Laptop, Desktop, Servidor)
- **Asistencia rápida**: Modal con instrucciones paso a paso para usuarios
- **Captura manual**: Entrada manual de ID y contraseña de RustDesk
- **Ejecutable incluido**: Descarga directa de rustdesk.exe desde la aplicación
- **Comunicación integrada**: Envío de credenciales por chat interno

### 💬 Chat de Soporte en Tiempo Real
- **SignalR integrado**: Comunicación instantánea sin recargas
- **Conversaciones archivadas**: Sistema de archivo tipo WhatsApp
- **Mensajes no leídos**: Contador automático de mensajes pendientes
- **Icono flotante**: Acceso rápido al chat desde cualquier página
- **Panel mini-chat**: Vista previa de conversaciones recientes
- **Eliminación de mensajes**: Admin/soporte pueden eliminar mensajes
- **Estados de usuario**: Indicador online/offline en tiempo real
- **Notificaciones push**: Alertas instantáneas de nuevos mensajes
- **Autenticación JWT**: ChatController con autorización requerida
- **Mensajes internos**: Comunicación privada entre admin/soporte

### 📄 Sistema de Paz y Salvo
- **Gestión documental**: Subida y gestión de documentos de paz y salvo
- **Almacenamiento seguro**: Archivos guardados en `Storage/pazysalvo` (fuera de `wwwroot`)
- **Acceso protegido**: Descarga/preview vía endpoints autenticados (SecureFileController), sin acceso directo a disco
- **Validación de activos**: Verificación de activos pendientes por usuario
- **Estados de aprobación**: Pendiente, Aprobado, Rechazado
- **Historial completo**: Seguimiento de todos los documentos por usuario

### 🎫 Sistema de Tickets de Soporte
- **Creación múltiple**: Desde usuario, admin o chat integrado
- **Estados avanzados**: Pendiente, Asignado, En Proceso, Resuelto, Cerrado
- **Prioridades**: Baja, Media, Alta, Crítica
- **Categorías**: Hardware, Software, Red, Otros
- **Comentarios internos**: Sistema de comunicación con visibilidad controlada
- **Evidencias adjuntas**: Subida de archivos y capturas de pantalla
- **Activos relacionados**: Vinculación directa con activos específicos

### 📄 Gestión de Actas y Documentación
- **Actas de entrega**: Generación automática de PDFs y previsualización en navegador
- **Logo PDF**: usa `public/logo.png` por defecto (fallback interno si aplica)
- **Métodos de firma**: `Digital`, `PDF_Subido`, `Admin_Subida`
- **Estados**: `Pendiente`, `Pendiente de aprobación`, `Firmada`, `Aprobada`, `Rechazada`, `Anulada`
- **Almacenamiento por categoría**: PDFs en `Storage/actas/<Categoria>` (fuera de `wwwroot`), servidos por endpoints autenticados
- **Nombres legibles y versionado**: "Acta de entrega - Nombre Apellido dd de mes de yyyy vN.pdf"
- **Integridad**: cálculo y verificación de hash SHA256 del PDF
- **Historial completo**: Seguimiento de cambios, aprobaciones y observaciones

### 📊 Dashboard y Reportes Avanzados
- **Métricas en tiempo real**: Estadísticas de uso y rendimiento
- **Gráficos interactivos**: Visualización de datos con Chart.js
- **Filtros avanzados**: Búsqueda por múltiples criterios
- **Exportación de datos**: Generación de reportes en múltiples formatos
- **KPI personalizables**: Indicadores clave de rendimiento

### 🔔 Sistema de Notificaciones
- **Notificaciones en tiempo real (SignalR)** y persistentes en BD
- **Eventos clave**: firma de usuario, subida de PDF, aprobación, rechazo, marcado como pendiente, subida TI, asignación/devolución de activo, asignación y cambio de estado de ticket, nuevo comentario, **asignación/actualización de evento de calendario**
- **Estado de lectura** y agrupación por usuario/rol
- **Front**: campana moderna (auto-marcar leídas al abrir sin desaparecer, scroll de 3–4, borrar una/todas, limpieza progresiva, dark/light)

### 🗓️ Calendario de TI (Nuevo)
- **Solo admin/soporte**: Acceso desde `Sidebar > Calendario`
- **Vistas**: Mes, Semana, Día (FullCalendar v6) con indicadores de “hoy”, números de semana y encabezados pegajosos
- **Creación rápida**: Selecciona rango de días para abrir un modal moderno; fechas se autocompletan (09:00–18:00). En multi-día, el fin se fija al último día 18:00
- **Asignados**: Autocompletado multi de usuarios con rol `admin/soporte` (IDs de `AuthUser`), con búsqueda por nombre/departamento/email
- **Edición**: Desde el detalle puedes “Editar” (abre el mismo formulario precargado)
- **Eliminar**: Confirmación visual y refresco inmediato del calendario
- **Notificaciones**: Al crear/actualizar se notifica a cada asignado (campana + persistencia)
- **Tema**: Estilos adaptados a dark/light y diseño consistente con el resto de la app
- **Instalación**: CSS de FullCalendar cargado por CDN en `public/index.html` (no importar `main.css`/`index.css` en componentes)

## 🛠️ Stack Tecnológico

### Frontend
- **React 18**: Framework principal con hooks modernos
- **React Router v6**: Navegación y routing avanzado
- **Tailwind CSS 3**: Framework CSS utility-first
- **Lucide React**: Iconografía moderna y consistente
- **Headless UI**: Componentes accesibles y sin estilos
- **React Table v8**: Tablas de datos avanzadas con filtros
- **React Hook Form**: Gestión de formularios eficiente
- **Chart.js**: Gráficos interactivos y responsivos
- **Axios**: Cliente HTTP para comunicación con API
- **JWT Decode**: Manejo de tokens de autenticación
- **SignalR Client**: Comunicación en tiempo real

### Backend
- **ASP.NET Core 8**: Framework web moderno
- **Entity Framework Core 8**: ORM con migraciones automáticas
- **SQL Server**: Base de datos relacional robusta
- **JWT Bearer**: Autenticación basada en tokens
- **SignalR**: Comunicación en tiempo real
- **AutoMapper**: Mapeo de objetos
- **FluentValidation**: Validación de datos
- **Serilog**: Logging estructurado
- **Swagger/OpenAPI**: Documentación automática de API
- **Migraciones automáticas**: `Database.Migrate()` al iniciar la API

### Base de Datos
- **SQL Server**: Motor de base de datos principal
- **Migraciones EF Core**: Control de versiones de esquema
- **Índices optimizados**: Rendimiento mejorado en consultas
- **Relaciones complejas**: Foreign keys y constraints

## 📱 Características Responsive y UX

### 🎨 Diseño Adaptativo
- **Mobile-first**: Diseño optimizado para dispositivos móviles
- **Sidebar responsive**: Se oculta automáticamente en pantallas pequeñas
- **Navegación optimizada**: Botón hamburguesa en móviles
- **Tablas responsivas**: Se adaptan a cualquier tamaño de pantalla
- **Formularios adaptativos**: Campos que se ajustan al dispositivo

### 🌙 Temas y Personalización
- **Modo oscuro/claro**: Soporte completo para ambos temas
- **Transiciones suaves**: Animaciones fluidas entre temas
- **Consistencia visual**: Diseño coherente en toda la aplicación
- **Componentes reutilizables**: Biblioteca de componentes estandarizados

### ♿ Accesibilidad
- **Navegación por teclado**: Soporte completo para navegación sin mouse
- **Contraste adecuado**: Cumplimiento de estándares WCAG
- **Etiquetas semánticas**: HTML semántico para lectores de pantalla
- **ARIA labels**: Atributos de accesibilidad implementados

### 🎨 UI/UX Mejorada
- **Botones estéticos**: Gradientes, sombras y efectos hover
- **Iconos flotantes**: Acceso rápido a funcionalidades clave
- **Animaciones fluidas**: Transiciones suaves entre estados
- **Feedback visual**: Indicadores claros de acciones y estados
- **Diseño moderno**: Interfaz limpia y profesional

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js 18+**: Runtime de JavaScript
- **.NET Core 8 SDK**: Framework de desarrollo
- **SQL Server 2019+**: Base de datos (en mi caso use 2017)
- **Visual Studio 2022** o **VS Code**: IDE recomendado
- **SQL Server Management Studio (SSMS)**: Para ejecutar scripts SQL

### Frontend
```bash
# Clonar el repositorio
git clone [https://github.com/elnames/PortalTI.git]
cd PortalTI

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de la API

# Ejecutar en modo desarrollo
npm start

# Construir para producción
npm run build
```

### Backend
```bash
# Navegar al directorio del backend
cd portalti-backend/PortalTi.Api

# Restaurar dependencias de NuGet
dotnet restore

# Configurar base de datos
# Editar appsettings.json con connection string

# (Opcional) Ejecutar migraciones manualmente
dotnet ef database update

# Ejecutar en modo desarrollo
dotnet run

# O ejecutar con hot reload
dotnet watch run
```

### Base de Datos
```bash
# Opción 1: Migraciones automáticas (recomendado)
# El backend aplica migraciones automáticamente al iniciar

# Opción 2: Script completo de base de datos
# Ejecutar el script SQL completo para crear toda la BD desde cero
sqlcmd -S localhost -i CREAR_BD_COMPLETA.sql

# Opción 3: Migraciones manuales
dotnet ef database update

# Poblar con datos de prueba (opcional)
# Usar el botón "🔄 Poblar BD Genérica" en el dashboard
# O ejecutar el script SQL: POBLAR_BD.sql

# Crear usuario admin inicial
sqlcmd -S localhost -i CREAR_ADMIN.sql
```

## 🔧 Configuración Avanzada

### Variables de Entorno Frontend
```env
REACT_APP_API_URL=http://localhost:5266
REACT_APP_ENVIRONMENT=development
```

### Configuración Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PortalTi;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "JwtSettings": {
    "SecretKey": "tu_clave_terriblesecreta_ymuy_larga_lolxd_342f2322w212CE",
    "Issuer": "PortalTI",
    "Audience": "PortalTIUsers",
    "ExpirationMinutes": 1440
  },
  "Storage": {
    "Root": "C:/PortalTI/Storage",
    "MaxFileSizeMB": 10,
    "AllowedExtensions": [".pdf", ".png", ".jpg"],
    "RetentionDays": 180,
    "EnableHashVerification": true
  }
}
```

## 📁 Estructura del Proyecto

```
PortalTI/
├── src/                          # Frontend React
│   ├── components/              # Componentes reutilizables
│   │   ├── ActivosAsignadosCell.jsx
│   │   ├── AsignarActivoModal.jsx
│   │   ├── ChatInternoModal.jsx
│   │   ├── DataTable.jsx
│   │   ├── FloatingChatIcon.jsx  # Chat flotante en tiempo real
│   │   ├── GenerarActaModal.jsx
│   │   ├── Header.jsx
│   │   ├── PazYSalvoManager.jsx  # Gestión de paz y salvo
│   │   ├── RemoteControlButton.jsx # Control remoto RustDesk
│   │   ├── RustDeskModal.jsx     # Modal de configuración RustDesk
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── pages/                   # Páginas principales
│   │   ├── Actas.jsx
│   │   ├── Activos.jsx
│   │   ├── Chat.jsx             # Chat principal con SignalR
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── PazYSalvo.jsx        # Página de paz y salvo
│   │   ├── Tickets.jsx
│   │   └── Usuarios.jsx
│   ├── contexts/                # Contextos de React
│   │   ├── AuthContext.jsx
│   │   ├── NotificationContext.jsx
│   │   ├── SearchContext.jsx
│   │   └── ThemeContext.jsx
│   ├── services/                # Servicios API
│   │   └── api.js
│   ├── layouts/                 # Layouts de la aplicación
│   │   └── MainLayout.jsx
│   └── hooks/                   # Custom hooks
│       ├── useChatSignalR.js    # Hook para SignalR
│       ├── useResponsiveSidebar.js # Hook para sidebar responsivo
│       └── useWindowSize.js
├── portalti-backend/            # Backend .NET Core
│   └── PortalTi.Api/           # API principal
│       ├── Controllers/         # Controladores API
│       │   ├── ActasController.cs
│       │   ├── ActivosController.cs
│       │   ├── AuthController.cs
│       │   ├── ChatController.cs
│       │   ├── DashboardController.cs
│       │   ├── PazYSalvoController.cs # Controlador paz y salvo
│       │   ├── TicketsController.cs
│       │   └── UsuariosController.cs
│       ├── Models/              # Modelos de datos
│       │   ├── Acta.cs
│       │   ├── Activo.cs        # Incluye RustDeskId
│       │   ├── AuthUser.cs
│       │   ├── ChatConversacion.cs
│       │   ├── ChatMensaje.cs
│       │   ├── PazYSalvo.cs     # Modelo paz y salvo
│       │   ├── Ticket.cs
│       │   └── ...
│       ├── Data/                # Capa de datos
│       │   ├── PortalTiContext.cs
│       │   └── DbInitializer.cs
│       ├── Hubs/                # SignalR Hubs
│       │   └── ChatHub.cs       # Hub para chat en tiempo real
│       ├── Migrations/          # Migraciones EF Core
│       │   ├── AddPazYSalvoTableOnly.cs
│       │   ├── AddRustDeskIdToActivos.cs
│       │   └── ...
│       └── Services/            # Servicios de negocio
│           └── PdfService.cs
├── public/                      # Archivos estáticos
│   ├── rustdesk.exe            # Ejecutable RustDesk
│   └── ...
├── CREAR_BD_COMPLETA.sql       # Script completo para crear toda la BD
├── CREAR_ADMIN.sql             # Script para crear usuario admin inicial
├── POBLAR_BD.sql               # Script de población de datos
└── README.md                   # Este archivo
```

## 👥 Roles y Permisos Detallados

### 🔧 Administrador (admin)
- **Gestión completa de usuarios**: Crear, editar, eliminar usuarios
- **Gestión de activos**: Control total sobre inventario
- **Configuración del sistema**: Ajustes globales
- **Reportes avanzados**: Acceso a todas las métricas
- **Gestión de actas**: Aprobación y administración
- **Chat de soporte**: Acceso completo a conversaciones
- **Población de datos**: Botón para poblar BD con datos de prueba
- **Control remoto**: Acceso completo a funcionalidad RustDesk
- **Gestión de paz y salvo**: Administración de documentos
- **Eliminación de mensajes**: Puede eliminar mensajes del chat

### 🛠️ Soporte Técnico (soporte)
- **Gestión de activos**: Asignar, devolver, dar de baja
- **Gestión de tickets**: Crear, asignar, resolver tickets
- **Chat de soporte**: Conversaciones con usuarios
- **Gestión de actas**: Crear y gestionar actas de entrega
- **Reportes básicos**: Métricas de soporte
- **Comentarios internos**: Comunicación privada en tickets
- **Control remoto**: Acceso a funcionalidad RustDesk
- **Asistencia RustDesk**: Ayudar a usuarios con configuración
- **Eliminación de mensajes**: Puede eliminar mensajes del chat

### 👤 Usuario Regular (usuario)
- **Visualización de activos**: Ver activos asignados
- **Creación de tickets**: Solicitar soporte técnico
- **Acceso a actas**: Ver actas personales
- **Chat de soporte**: Comunicación con soporte
- **Perfil personal**: Editar información personal
- **Notificaciones**: Recibir alertas del sistema
- **Paz y salvo**: Subir documentos de paz y salvo
- **RustDesk**: Recibir asistencia para configuración

## 🔒 Seguridad y Autenticación

### 🛡️ Medidas de Seguridad
- **Autenticación JWT**: Tokens seguros con expiración
- **Autorización por roles**: Control granular de acceso
- **Validación de datos**: Sanitización de inputs
- **HTTPS**: Comunicación encriptada
- **Logs de seguridad**: Auditoría de acciones
- **Protección CSRF**: Prevención de ataques

### 🔐 Gestión de Sesiones
- **Tokens de acceso**: JWT con expiración configurable
- **Renovación automática**: Refresh tokens
- **Logout seguro**: Invalidación de tokens
- **Sesiones múltiples**: Soporte para múltiples dispositivos

## 📈 Funcionalidades Avanzadas

### 🔍 Búsqueda y Filtros
- **Búsqueda global**: En activos, usuarios, tickets
- **Filtros avanzados**: Por empresa, ubicación, estado
- **Búsqueda en tiempo real**: Resultados instantáneos
- **Historial de búsquedas**: Búsquedas recientes

### 📊 Dashboard Interactivo
- **Métricas en tiempo real**: Estadísticas actualizadas
- **Gráficos dinámicos**: Visualización de datos
- **Filtros por período**: Análisis temporal
- **KPIs personalizables**: Indicadores clave

### 🔔 Sistema de Notificaciones
- **Notificaciones push**: Alertas instantáneas
- **Tipos múltiples**: Info, Warning, Error, Success
- **Persistencia**: Historial de notificaciones
- **Configuración personal**: Preferencias por usuario

### 🖥️ Control Remoto RustDesk
- **Integración nativa**: Control remoto desde la aplicación
- **Persistencia de datos**: IDs guardados automáticamente
- **Asistencia guiada**: Instrucciones paso a paso
- **Comunicación integrada**: Envío de credenciales por chat
- **Filtrado inteligente**: Solo equipos compatibles

### 💬 Chat en Tiempo Real
- **SignalR integrado**: Comunicación instantánea
- **Archivado de conversaciones**: Sistema tipo WhatsApp
- **Contador de mensajes**: Indicador de mensajes no leídos
- **Icono flotante**: Acceso rápido desde cualquier página
- **Estados de usuario**: Online/offline en tiempo real

## 🎯 Casos de Uso Principales

### 📋 Gestión de Inventario
1. **Registro de activos**: Ingreso de equipos con especificaciones
2. **Asignación**: Asignar activos a usuarios específicos
3. **Seguimiento**: Monitoreo de ubicación y estado
4. **Mantenimiento**: Control de reparaciones y actualizaciones
5. **Baja**: Proceso de retiro de activos
6. **Control remoto**: Configuración y acceso remoto con RustDesk

### 🎫 Soporte Técnico
1. **Creación de tickets**: Usuarios reportan problemas
2. **Asignación**: Distribución de tickets al soporte
3. **Resolución**: Proceso de solución de problemas
4. **Seguimiento**: Comunicación y actualizaciones
5. **Cierre**: Finalización y documentación
6. **Chat en tiempo real**: Comunicación instantánea
7. **Control remoto**: Asistencia remota con RustDesk

### 📄 Gestión Documental
1. **Generación de actas**: Creación automática de documentos
2. **Firma digital**: Proceso de firma electrónica
3. **Aprobación**: Flujo de aprobación administrativa
4. **Almacenamiento**: Archivo seguro de documentos
5. **Consulta**: Acceso y búsqueda de actas
6. **Paz y salvo**: Gestión de documentos de salida

### 💬 Comunicación Interna
1. **Chat en tiempo real**: Comunicación instantánea
2. **Conversaciones archivadas**: Organización de chats
3. **Mensajes no leídos**: Seguimiento de comunicación
4. **Estados de usuario**: Disponibilidad en tiempo real
5. **Eliminación de mensajes**: Moderación de contenido

## 🚀 Despliegue

### Desarrollo
```bash
# Frontend
npm start

# Backend
dotnet run

# Base de datos
# SQL Server debe estar ejecutándose
```

### Producción
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

## 🧪 Testing

### Frontend
```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration
```

### Backend
```bash
# Tests unitarios
dotnet test

# Tests de integración
dotnet test --filter Category=Integration
```

## 📚 Documentación

### **Scripts de Base de Datos**
- **`CREAR_BD_COMPLETA.sql`**: Script completo para crear toda la base de datos desde cero
- **`CREAR_ADMIN.sql`**: Script para crear el usuario admin inicial (admin/admin)
- **`POBLAR_BD.sql`**: Script para poblar la base de datos con datos de prueba

### **Screenshots y Demostraciones**
- **[📸 Galería de Screenshots](./docs/screenshots.md)**: Galería completa con capturas de pantalla organizadas
- **[📸 Screenshots del Sistema](./screenshots/README.md)**: Estructura de archivos de screenshots
- **Dashboard**: Vista principal con estadísticas y métricas
- **Gestión de Activos**: Inventario, asignaciones y control remoto
- **Chat en Tiempo Real**: Comunicación instantánea con SignalR
- **Sistema de Tickets**: Soporte técnico completo
- **Gestión de Actas**: Documentos de entrega con firma digital
- **Calendario de TI**: Gestión de eventos y tareas
- **Notificaciones**: Sistema de alertas en tiempo real

### **Documentación Técnica Completa**
Para una documentación detallada de arquitectura, API, base de datos y guías de desarrollo, consulta:
- **[📚 Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)**

### **Documentación API**
La documentación de la API está disponible en:
- **Swagger UI**: `http://localhost:5266/swagger`
- **OpenAPI JSON**: `http://localhost:5266/swagger/v1/swagger.json`

#### Endpoints destacados de Actas

- `POST /api/actas/generar` (admin/soporte): genera acta desde cualquier estado, con opción de incluir firma TI y fecha de entrega
- `POST /api/actas/firmar-digital` (usuario): firma digital y genera PDF final
- `POST /api/actas/subir-pdf` (usuario): sube PDF y pasa a "Pendiente de aprobación"
- `POST /api/actas/subir-admin` (admin/soporte): sube PDF en nombre de TI
- `POST /api/actas/{id}/aprobar` (admin/soporte): aprueba acta (comentario opcional)
- `POST /api/actas/{id}/rechazar` (admin/soporte): rechaza acta (motivo opcional)
- `POST /api/actas/{id}/pendiente` (admin/soporte): marca acta como pendiente
- `POST /api/actas/{id}/upload-pdf-ti` (admin/soporte): adjunta PDF TI
- `POST /api/actas/{id}/anular` (admin/soporte): anula acta
- `GET  /api/actas/{id}/preview-auto`: previsualización inteligente (PDF_Usuario > PDF_Admin > Digital_Signed > Plantilla)
 - `GET  /api/actas/test` (anónimo): healthcheck usado por el front para verificar disponibilidad

#### Endpoints de archivos seguros
- `GET /api/securefile/preview/{tipo}/{archivo}`
- `GET /api/securefile/download/{tipo}/{archivo}`
- `POST /api/securefile/verify` (hash)

### **Documentación RustDesk**
Para información sobre la integración con RustDesk:
- **[📖 Guía RustDesk](./public/README_RUSTDESK.md)**
- **[🔧 API RustDesk](./public/GUIA_RUSTDESK_API.md)**

## 👮‍♂️ UX por Roles (Actas)

- **Admin/Soporte**: Generar Acta, Aprobar, Rechazar, Marcar Pendiente, Anular, Subir PDF (TI). No ven "Firmar Digital".
- **Usuario**: Firmar Digital (se ofrece crear firma si no existe), Subir PDF (el estado cambia a "Pendiente de aprobación").

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### Estándares de Código
- **Frontend**: ESLint + Prettier
- **Backend**: StyleCop + EditorConfig
- **Commits**: Conventional Commits
- **Branches**: Git Flow

## 🐛 Reporte de Bugs

Para reportar bugs o solicitar features:
1. Crear un issue en GitHub
2. Incluir pasos para reproducir
3. Adjuntar logs y capturas de pantalla
4. Especificar versión y entorno

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autores

- **Dev**: [names]


## 🙏 Agradecimientos

- **React Team**: Por el excelente framework
- **Microsoft**: Por .NET Core y Entity Framework
- **Tailwind CSS**: Por el framework de estilos
- **SignalR**: Por la comunicación en tiempo real
- **RustDesk**: Por la herramienta de control remoto
- **Comunidad Open Source**: Por las librerías utilizadas

## 📞 Soporte

Para soporte técnico:
- **Email**: javier.rjorquera@gmail.com
- **Documentación**: [📚 Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)
- **Issues**: GitHub Issues

---

**PortalTI** - Sistema Integral de Gestión de Activos
*Desarrollado con ❤️ en nombre de mi homero QEPD🐶🕊️ (02/08/25)*
