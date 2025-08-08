# Portal IT - Sistema de Gestión de Activos

## 📋 Descripción

Portal IT es una aplicación web moderna para la gestión integral de activos tecnológicos, usuarios y tickets de soporte. Desarrollada con React en el frontend y .NET Core en el backend.

## 🚀 Características Principales

### 👥 Gestión de Usuarios
- **Roles diferenciados**: Admin, Soporte, Usuario
- **Perfiles completos**: Información personal y laboral
- **Gestión de firmas digitales**: Subida y gestión de firmas

### 💻 Gestión de Activos
- **Categorización**: Equipos, Móviles, Monitores, Periféricos, Accesorios, Red
- **Asignación dinámica**: Asignar activos a usuarios
- **Historial completo**: Seguimiento de asignaciones y cambios
- **Estados**: Disponible, Asignado, En Mantenimiento, Dado de Baja

### 🎫 Sistema de Tickets
- **Creación múltiple**: Usuario, Admin, Chat
- **Estados**: Abierto, En Proceso, Resuelto, Cerrado
- **Comentarios**: Sistema de comunicación interna
- **Activos relacionados**: Vincular tickets con activos específicos

### 📄 Gestión de Actas
- **Subida de PDFs**: Gestión de documentos
- **Previsualización**: Visualización de actas firmadas
- **Asociación con usuarios**: Relacionar actas con usuarios específicos

### 💬 Chat de Soporte
- **Conversaciones en tiempo real**: Chat integrado
- **Generación de tickets**: Crear tickets desde el chat
- **Historial de conversaciones**: Seguimiento completo

### 📊 Reportes y Dashboard
- **Estadísticas en tiempo real**: Métricas de uso
- **Filtros avanzados**: Búsqueda y filtrado por múltiples criterios
- **Exportación**: Generación de reportes

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18**: Framework principal
- **React Router**: Navegación
- **Tailwind CSS**: Estilos y diseño responsive
- **Lucide React**: Iconografía
- **Headless UI**: Componentes accesibles
- **React Table**: Tablas de datos

### Backend
- **.NET Core 8**: Framework backend
- **Entity Framework Core**: ORM
- **SQL Server**: Base de datos
- **JWT**: Autenticación
- **SignalR**: Comunicación en tiempo real

## 📱 Características Responsive

- **Diseño adaptativo**: Funciona en móviles, tablets y desktop
- **Sidebar responsive**: Se oculta automáticamente en pantallas pequeñas
- **Navegación optimizada**: Botón de hamburguesa en móviles
- **Tablas responsivas**: Se adaptan a cualquier pantalla

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- .NET Core 8 SDK
- SQL Server

### Frontend
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Construir para producción
npm run build
```

### Backend
```bash
# Navegar al directorio del backend
cd portalti-backend/PortalTi.Api

# Restaurar dependencias
dotnet restore

# Ejecutar migraciones
dotnet ef database update

# Ejecutar en modo desarrollo
dotnet run
```

## 🔧 Configuración

### Variables de Entorno
Crear archivo `.env` en el directorio raíz:

```env
REACT_APP_API_URL=http://localhost:5263
```

### Base de Datos
1. Configurar SQL Server
2. Actualizar connection string en `appsettings.json`
3. Ejecutar migraciones: `dotnet ef database update`

## 📁 Estructura del Proyecto

```
portal_ti/
├── src/                    # Frontend React
│   ├── components/        # Componentes reutilizables
│   ├── pages/            # Páginas principales
│   ├── contexts/         # Contextos de React
│   ├── services/         # Servicios API
│   └── layouts/          # Layouts de la aplicación
├── portalti-backend/     # Backend .NET Core
│   └── PortalTi.Api/    # API principal
└── README.md
```

## 👥 Roles y Permisos

### 🔧 Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios y roles
- Configuración del sistema
- Reportes avanzados

### 🛠️ Soporte Técnico
- Gestión de activos y tickets
- Chat de soporte
- Gestión de actas
- Reportes básicos

### 👤 Usuario Regular
- Visualización de activos asignados
- Creación de tickets
- Acceso a actas personales
- Chat de soporte

## 🎨 Características de UI/UX

### 🌙 Modo Oscuro
- Soporte completo para tema oscuro
- Transiciones suaves entre temas
- Consistencia visual en toda la aplicación

### 📱 Responsive Design
- Diseño mobile-first
- Sidebar adaptativo
- Tablas responsivas
- Botones optimizados para touch

### ♿ Accesibilidad
- Navegación por teclado
- Contraste adecuado
- Etiquetas semánticas
- Componentes accesibles

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros
- **Autorización por roles**: Control de acceso granular
- **Validación de datos**: Sanitización de inputs
- **HTTPS**: Comunicación encriptada

## 📈 Funcionalidades Avanzadas

### 🔍 Búsqueda Global
- Búsqueda en activos, usuarios y tickets
- Resultados en tiempo real
- Filtros avanzados

### 📊 Dashboard Interactivo
- Métricas en tiempo real
- Gráficos dinámicos
- Filtros por período

### 🔔 Sistema de Notificaciones
- Notificaciones en tiempo real
- Alertas de estado
- Recordatorios automáticos

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.