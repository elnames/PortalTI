# PortalTI - Sistema Integral de Gestión de Activos y Necesidades Tecnológicas

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

### 🎫 Sistema de Tickets de Soporte
- **Creación múltiple**: Desde usuario, admin o chat integrado
- **Estados avanzados**: Pendiente, Asignado, En Proceso, Resuelto, Cerrado
- **Prioridades**: Baja, Media, Alta, Crítica
- **Categorías**: Hardware, Software, Red, Otros
- **Comentarios internos**: Sistema de comunicación con visibilidad controlada
- **Evidencias adjuntas**: Subida de archivos y capturas de pantalla
- **Activos relacionados**: Vinculación directa con activos específicos

### 📄 Gestión de Actas y Documentación
- **Actas de entrega**: Generación automática de PDFs
- **Múltiples métodos de firma**: Digital, PDF subido, Admin subida
- **Estados de aprobación**: Pendiente, Firmada, Aprobada, Rechazada
- **Previsualización**: Visualización de actas antes de la firma
- **Historial completo**: Seguimiento de cambios y aprobaciones

### 💬 Chat de Soporte Integrado
- **Conversaciones en tiempo real**: Chat interno para soporte técnico
- **Generación automática de tickets**: Crear tickets desde conversaciones
- **Mensajes internos**: Comunicación privada entre soporte
- **Historial persistente**: Conversaciones guardadas y consultables
- **Estados de conversación**: Activa, Cerrada, Pendiente

### 📊 Dashboard y Reportes Avanzados
- **Métricas en tiempo real**: Estadísticas de uso y rendimiento
- **Gráficos interactivos**: Visualización de datos con Chart.js
- **Filtros avanzados**: Búsqueda por múltiples criterios
- **Exportación de datos**: Generación de reportes en múltiples formatos
- **KPI personalizables**: Indicadores clave de rendimiento

### 🔔 Sistema de Notificaciones
- **Notificaciones en tiempo real**: Alertas instantáneas
- **Tipos múltiples**: Info, Warning, Error, Success
- **Persistencia**: Notificaciones guardadas en base de datos
- **Estado de lectura**: Control de notificaciones leídas/no leídas

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

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js 18+**: Runtime de JavaScript
- **.NET Core 8 SDK**: Framework de desarrollo
- **SQL Server 2019+**: Base de datos (en mi caso use 2017)
- **Visual Studio 2022** o **VS Code**: IDE recomendado

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

# Ejecutar migraciones
dotnet ef database update

# Ejecutar en modo desarrollo
dotnet run

# O ejecutar con hot reload
dotnet watch run
```

### Base de Datos
```bash
# Ejecutar migraciones iniciales
dotnet ef database update

# Poblar con datos de prueba (opcional)
# Usar el botón "🔄 Poblar BD Genérica" en el dashboard
# O ejecutar el script SQL: POBLAR_BD.sql
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
    "ExpirationHours": 24
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
│   │   ├── GenerarActaModal.jsx
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── pages/                   # Páginas principales
│   │   ├── Actas.jsx
│   │   ├── Activos.jsx
│   │   ├── Chat.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
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
│       └── useWindowSize.js
├── portalti-backend/            # Backend .NET Core
│   └── PortalTi.Api/           # API principal
│       ├── Controllers/         # Controladores API
│       │   ├── ActasController.cs
│       │   ├── ActivosController.cs
│       │   ├── AuthController.cs
│       │   ├── ChatController.cs
│       │   ├── DashboardController.cs
│       │   ├── TicketsController.cs
│       │   └── UsuariosController.cs
│       ├── Models/              # Modelos de datos
│       │   ├── Acta.cs
│       │   ├── Activo.cs
│       │   ├── AuthUser.cs
│       │   ├── Ticket.cs
│       │   └── ...
│       ├── Data/                # Capa de datos
│       │   ├── PortalTiContext.cs
│       │   └── DbInitializer.cs
│       ├── Migrations/          # Migraciones EF Core
│       └── Services/            # Servicios de negocio
│           └── PdfService.cs
├── public/                      # Archivos estáticos
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

### 🛠️ Soporte Técnico (soporte)
- **Gestión de activos**: Asignar, devolver, dar de baja
- **Gestión de tickets**: Crear, asignar, resolver tickets
- **Chat de soporte**: Conversaciones con usuarios
- **Gestión de actas**: Crear y gestionar actas de entrega
- **Reportes básicos**: Métricas de soporte
- **Comentarios internos**: Comunicación privada en tickets

### 👤 Usuario Regular (usuario)
- **Visualización de activos**: Ver activos asignados
- **Creación de tickets**: Solicitar soporte técnico
- **Acceso a actas**: Ver actas personales
- **Chat de soporte**: Comunicación con soporte
- **Perfil personal**: Editar información personal
- **Notificaciones**: Recibir alertas del sistema

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

## 🎯 Casos de Uso Principales

### 📋 Gestión de Inventario
1. **Registro de activos**: Ingreso de equipos con especificaciones
2. **Asignación**: Asignar activos a usuarios específicos
3. **Seguimiento**: Monitoreo de ubicación y estado
4. **Mantenimiento**: Control de reparaciones y actualizaciones
5. **Baja**: Proceso de retiro de activos

### 🎫 Soporte Técnico
1. **Creación de tickets**: Usuarios reportan problemas
2. **Asignación**: Distribución de tickets al soporte
3. **Resolución**: Proceso de solución de problemas
4. **Seguimiento**: Comunicación y actualizaciones
5. **Cierre**: Finalización y documentación

### 📄 Gestión Documental
1. **Generación de actas**: Creación automática de documentos
2. **Firma digital**: Proceso de firma electrónica
3. **Aprobación**: Flujo de aprobación administrativa
4. **Almacenamiento**: Archivo seguro de documentos
5. **Consulta**: Acceso y búsqueda de actas

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

### **Documentación Técnica Completa**
Para una documentación detallada de arquitectura, API, base de datos y guías de desarrollo, consulta:
- **[📚 Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)**

### **Documentación API**
La documentación de la API está disponible en:
- **Swagger UI**: `http://localhost:5266/swagger`
- **OpenAPI JSON**: `http://localhost:5266/swagger/v1/swagger.json`

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
- **Comunidad Open Source**: Por las librerías utilizadas

## 📞 Soporte

Para soporte técnico:
- **Email**: javier.rjorquera@gmail.com
- **Documentación**: [📚 Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)
- **Issues**: GitHub Issues

---

**PortalTI** - Sistema Integral de Gestión de Activos
*Desarrollado con ❤️ en nombre de mi homero QEPD🐶🕊️ (02/08/25)*
