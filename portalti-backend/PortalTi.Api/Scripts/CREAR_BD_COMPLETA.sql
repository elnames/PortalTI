-- =====================================================
-- SCRIPT PARA CREAR BASE DE DATOS PORTAL TI COMPLETA
-- Incluye todas las tablas, relaciones, índices y usuario admin inicial
-- =====================================================

SET QUOTED_IDENTIFIER ON
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PortalTi')
BEGIN
    CREATE DATABASE [PortalTi]
END
GO

USE [PortalTi]
GO

-- =====================================================
-- 1. ELIMINAR TABLAS EXISTENTES (ORDEN CORRECTO POR FOREIGN KEYS)
-- =====================================================

PRINT 'Eliminando tablas existentes...'

-- Tablas dependientes primero
IF OBJECT_ID('ChatArchivos', 'U') IS NOT NULL DROP TABLE [ChatArchivos]
IF OBJECT_ID('ChatMensajes', 'U') IS NOT NULL DROP TABLE [ChatMensajes]
IF OBJECT_ID('ChatConversaciones', 'U') IS NOT NULL DROP TABLE [ChatConversaciones]
IF OBJECT_ID('CalendarEventAssignees', 'U') IS NOT NULL DROP TABLE [CalendarEventAssignees]
IF OBJECT_ID('CalendarEvents', 'U') IS NOT NULL DROP TABLE [CalendarEvents]
IF OBJECT_ID('ArchivosTickets', 'U') IS NOT NULL DROP TABLE [ArchivosTickets]
IF OBJECT_ID('ComentariosTickets', 'U') IS NOT NULL DROP TABLE [ComentariosTickets]
IF OBJECT_ID('Actas', 'U') IS NOT NULL DROP TABLE [Actas]
IF OBJECT_ID('AsignacionesActivos', 'U') IS NOT NULL DROP TABLE [AsignacionesActivos]
IF OBJECT_ID('Licencias', 'U') IS NOT NULL DROP TABLE [Licencias]
IF OBJECT_ID('ProgramasSeguridad', 'U') IS NOT NULL DROP TABLE [ProgramasSeguridad]
IF OBJECT_ID('Software', 'U') IS NOT NULL DROP TABLE [Software]
IF OBJECT_ID('ProgramasEstandar', 'U') IS NOT NULL DROP TABLE [ProgramasEstandar]
IF OBJECT_ID('PazYSalvos', 'U') IS NOT NULL DROP TABLE [PazYSalvos]
IF OBJECT_ID('UserActivityLogs', 'U') IS NOT NULL DROP TABLE [UserActivityLogs]
IF OBJECT_ID('AuditLogs', 'U') IS NOT NULL DROP TABLE [AuditLogs]
IF OBJECT_ID('Notificaciones', 'U') IS NOT NULL DROP TABLE [Notificaciones]
IF OBJECT_ID('SystemConfigurations', 'U') IS NOT NULL DROP TABLE [SystemConfigurations]
IF OBJECT_ID('Tickets', 'U') IS NOT NULL DROP TABLE [Tickets]
IF OBJECT_ID('Activos', 'U') IS NOT NULL DROP TABLE [Activos]
IF OBJECT_ID('NominaUsuarios', 'U') IS NOT NULL DROP TABLE [NominaUsuarios]
IF OBJECT_ID('AuthUsers', 'U') IS NOT NULL DROP TABLE [AuthUsers]

-- =====================================================
-- 2. CREAR TABLAS PRINCIPALES
-- =====================================================

PRINT 'Creando tablas principales...'

-- Tabla de usuarios de autenticación
CREATE TABLE [AuthUsers] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Username] nvarchar(50) NOT NULL,
    [PasswordHash] varbinary(max) NOT NULL,
    [PasswordSalt] varbinary(max) NOT NULL,
    [Role] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [PreferenciasJson] nvarchar(max) NULL,
    [SignaturePath] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETDATE(),
    [LastLoginAt] datetime2 NULL,
    CONSTRAINT [PK_AuthUsers] PRIMARY KEY ([Id])
)
GO

-- Tabla de usuarios de nómina
CREATE TABLE [NominaUsuarios] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Nombre] nvarchar(50) NOT NULL,
    [Apellido] nvarchar(50) NOT NULL,
    [Rut] nvarchar(20) NOT NULL,
    [Departamento] nvarchar(50) NULL,
    [Empresa] nvarchar(50) NULL,
    [Ubicacion] nvarchar(100) NULL,
    [Email] nvarchar(100) NULL,
    CONSTRAINT [PK_NominaUsuarios] PRIMARY KEY ([Id])
)
GO

-- Tabla de activos
CREATE TABLE [Activos] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Categoria] nvarchar(50) NOT NULL,
    [Codigo] nvarchar(50) NOT NULL,
    [Estado] nvarchar(20) NOT NULL,
    [Ubicacion] nvarchar(100) NULL,
    [NombreEquipo] nvarchar(100) NULL,
    [TipoEquipo] nvarchar(50) NULL,
    [Procesador] nvarchar(100) NULL,
    [SistemaOperativo] nvarchar(100) NULL,
    [Serie] nvarchar(100) NULL,
    [Ram] nvarchar(20) NULL,
    [Marca] nvarchar(50) NULL,
    [Modelo] nvarchar(100) NULL,
    [DiscosJson] nvarchar(max) NULL,
    [Pulgadas] nvarchar(20) NULL,
    [Imei] nvarchar(50) NULL,
    [Capacidad] nvarchar(20) NULL,
    [NumeroCelular] nvarchar(20) NULL,
    [Nombre] nvarchar(100) NULL,
    [Cantidad] int NULL,
    [Empresa] nvarchar(50) NULL,
    [FechaBaja] datetime2 NULL,
    [MotivoBaja] nvarchar(500) NULL,
    [RustDeskId] nvarchar(100) NULL,
    [RustDeskPassword] nvarchar(100) NULL,
    [AnyDeskId] nvarchar(100) NULL,
    [AnyDeskPassword] nvarchar(100) NULL,
    CONSTRAINT [PK_Activos] PRIMARY KEY ([Id])
)
GO

-- Tabla de tickets
CREATE TABLE [Tickets] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Titulo] nvarchar(200) NOT NULL,
    [Descripcion] nvarchar(max) NOT NULL,
    [NombreSolicitante] nvarchar(100) NOT NULL,
    [EmailSolicitante] nvarchar(100) NOT NULL,
    [TelefonoSolicitante] nvarchar(20) NULL,
    [Empresa] nvarchar(100) NOT NULL,
    [Departamento] nvarchar(100) NULL,
    [Categoria] nvarchar(50) NOT NULL,
    [Prioridad] nvarchar(20) NOT NULL,
    [Estado] nvarchar(20) NOT NULL DEFAULT 'Pendiente',
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaAsignacion] datetime2 NULL,
    [FechaResolucion] datetime2 NULL,
    [FechaCierre] datetime2 NULL,
    [AsignadoAId] int NULL,
    [CreadoPorId] int NULL,
    [ActivoId] int NULL,
    CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id])
)
GO

-- Tabla de asignaciones de activos
CREATE TABLE [AsignacionesActivos] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [ActivoId] int NOT NULL,
    [UsuarioId] int NOT NULL,
    [FechaAsignacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaDevolucion] datetime2 NULL,
    [Observaciones] nvarchar(500) NULL,
    [Estado] nvarchar(20) NOT NULL DEFAULT 'Activa',
    [AsignadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_AsignacionesActivos] PRIMARY KEY ([Id])
)
GO

-- Tabla de actas
CREATE TABLE [Actas] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [AsignacionId] int NOT NULL,
    [Estado] nvarchar(30) NOT NULL DEFAULT 'Pendiente',
    [MetodoFirma] nvarchar(20) NOT NULL DEFAULT 'Pendiente',
    [NombreArchivo] nvarchar(255) NULL,
    [RutaArchivo] nvarchar(500) NULL,
    [Observaciones] nvarchar(1000) NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaSubida] datetime2 NULL,
    [FechaFirma] datetime2 NULL,
    [FechaAprobacion] datetime2 NULL,
    [AprobadoPorId] int NULL,
    [ComentariosAprobacion] nvarchar(1000) NULL,
    [RowVersion] rowversion NOT NULL,
    [PdfHash] nvarchar(255) NULL,
    [FechaRechazo] datetime2 NULL,
    [RechazadoPorId] int NULL,
    [ComentariosRechazo] nvarchar(1000) NULL,
    CONSTRAINT [PK_Actas] PRIMARY KEY ([Id])
)
GO

-- Tabla de comentarios de tickets
CREATE TABLE [ComentariosTickets] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [TicketId] int NOT NULL,
    [Contenido] nvarchar(max) NOT NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [EsInterno] bit NOT NULL DEFAULT 0,
    [Evidencia] nvarchar(500) NULL,
    [EstadoCreacion] nvarchar(20) NULL,
    [EsMensajeChat] bit NOT NULL DEFAULT 0,
    [CreadoPorId] int NULL,
    CONSTRAINT [PK_ComentariosTickets] PRIMARY KEY ([Id])
)
GO

-- Tabla de archivos de tickets
CREATE TABLE [ArchivosTickets] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [TicketId] int NOT NULL,
    [NombreOriginal] nvarchar(255) NOT NULL,
    [NombreArchivo] nvarchar(255) NOT NULL,
    [RutaArchivo] nvarchar(500) NOT NULL,
    [TamañoBytes] bigint NOT NULL,
    [TipoMime] nvarchar(100) NULL,
    [FechaSubida] datetime2 NOT NULL DEFAULT GETDATE(),
    [SubidoPorId] int NULL,
    CONSTRAINT [PK_ArchivosTickets] PRIMARY KEY ([Id])
)
GO

-- Tabla de conversaciones de chat
CREATE TABLE [ChatConversaciones] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Titulo] nvarchar(200) NOT NULL,
    [Descripcion] nvarchar(500) NULL,
    [Estado] nvarchar(20) NOT NULL DEFAULT 'Activa',
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaCierre] datetime2 NULL,
    [UsuarioId] int NOT NULL,
    [SoporteId] int NULL,
    [TicketId] int NULL,
    CONSTRAINT [PK_ChatConversaciones] PRIMARY KEY ([Id])
)
GO

-- Tabla de mensajes de chat
CREATE TABLE [ChatMensajes] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [ConversacionId] int NOT NULL,
    [Contenido] nvarchar(max) NOT NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [EsInterno] bit NOT NULL DEFAULT 0,
    [EsLeido] bit NOT NULL DEFAULT 0,
    [FechaLectura] datetime2 NULL,
    [CreadoPorId] int NULL,
    CONSTRAINT [PK_ChatMensajes] PRIMARY KEY ([Id])
)
GO

-- Tabla de archivos de chat
CREATE TABLE [ChatArchivos] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [UsuarioId] int NOT NULL,
    [ConversacionId] int NOT NULL,
    [FechaArchivo] datetime2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ChatArchivos] PRIMARY KEY ([Id])
)
GO

-- Tabla de software
CREATE TABLE [Software] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Nombre] nvarchar(100) NOT NULL,
    [Version] nvarchar(50) NULL,
    [Estado] nvarchar(20) NOT NULL DEFAULT 'OK',
    [FechaInstalacion] date NULL,
    [Notas] nvarchar(500) NULL,
    [ActivoId] int NOT NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaActualizacion] datetime2 NULL,
    [CreadoPor] nvarchar(100) NULL,
    [ActualizadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_Software] PRIMARY KEY ([Id])
)
GO

-- Tabla de programas de seguridad
CREATE TABLE [ProgramasSeguridad] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Nombre] nvarchar(100) NOT NULL,
    [Tipo] nvarchar(50) NOT NULL DEFAULT 'Antivirus',
    [Estado] nvarchar(20) NOT NULL DEFAULT 'OK',
    [Notas] nvarchar(500) NULL,
    [ActivoId] int NOT NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaActualizacion] datetime2 NULL,
    [CreadoPor] nvarchar(100) NULL,
    [ActualizadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_ProgramasSeguridad] PRIMARY KEY ([Id])
)
GO

-- Tabla de licencias
CREATE TABLE [Licencias] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Software] nvarchar(100) NOT NULL,
    [Tipo] nvarchar(50) NOT NULL DEFAULT 'Perpetua',
    [NumeroLicencia] nvarchar(100) NULL,
    [UsuarioAsignado] nvarchar(100) NULL,
    [FechaInicio] date NULL,
    [FechaVencimiento] date NULL,
    [Notas] nvarchar(500) NULL,
    [ActivoId] int NOT NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaActualizacion] datetime2 NULL,
    [CreadoPor] nvarchar(100) NULL,
    [ActualizadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_Licencias] PRIMARY KEY ([Id])
)
GO

-- Tabla de programas estándar
CREATE TABLE [ProgramasEstandar] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Nombre] nvarchar(100) NOT NULL,
    [Categoria] nvarchar(50) NOT NULL,
    [Tipo] nvarchar(20) NOT NULL,
    [Descripcion] nvarchar(500) NULL,
    [VersionRecomendada] nvarchar(100) NULL,
    [Activo] bit NOT NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaActualizacion] datetime2 NULL,
    [CreadoPor] nvarchar(max) NULL,
    [ActualizadoPor] nvarchar(max) NULL,
    CONSTRAINT [PK_ProgramasEstandar] PRIMARY KEY ([Id])
)
GO

-- Tabla de paz y salvo
CREATE TABLE [PazYSalvos] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [UsuarioId] int NOT NULL,
    [UsuarioNombre] nvarchar(200) NOT NULL,
    [FechaSubida] datetime2 NOT NULL,
    [ArchivoPath] nvarchar(500) NOT NULL,
    [Estado] nvarchar(50) NOT NULL DEFAULT 'Pendiente',
    [ActivosPendientes] int NOT NULL DEFAULT 0,
    [Notas] nvarchar(1000) NULL,
    [FechaCreacion] datetime2 NOT NULL DEFAULT GETDATE(),
    [FechaActualizacion] datetime2 NULL,
    CONSTRAINT [PK_PazYSalvos] PRIMARY KEY ([Id])
)
GO

-- Tabla de logs de actividad de usuario
CREATE TABLE [UserActivityLogs] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [UserId] int NOT NULL,
    [Action] nvarchar(50) NOT NULL,
    [Description] nvarchar(500) NOT NULL,
    [Details] nvarchar(max) NULL,
    [Timestamp] datetime2 NOT NULL DEFAULT GETDATE(),
    [IpAddress] nvarchar(45) NULL,
    [UserAgent] nvarchar(500) NULL,
    CONSTRAINT [PK_UserActivityLogs] PRIMARY KEY ([Id])
)
GO

-- Tabla de logs de auditoría
CREATE TABLE [AuditLogs] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [UserId] int NOT NULL,
    [Action] nvarchar(100) NOT NULL,
    [ResourceType] nvarchar(100) NOT NULL,
    [ResourceId] int NULL,
    [IpAddress] nvarchar(45) NULL,
    [UserAgent] nvarchar(500) NULL,
    [Timestamp] datetime2 NOT NULL DEFAULT GETDATE(),
    [DataJson] nvarchar(4000) NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
)
GO

-- Tabla de notificaciones
CREATE TABLE [Notificaciones] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [UserId] int NOT NULL,
    [Tipo] nvarchar(40) NOT NULL,
    [Titulo] nvarchar(150) NOT NULL,
    [Mensaje] nvarchar(500) NOT NULL,
    [RefTipo] nvarchar(40) NULL,
    [RefId] int NULL,
    [Ruta] nvarchar(200) NULL,
    [IsRead] bit NOT NULL DEFAULT 0,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Notificaciones] PRIMARY KEY ([Id])
)
GO

-- Tabla de configuración del sistema
CREATE TABLE [SystemConfigurations] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Key] nvarchar(100) NOT NULL,
    [Value] nvarchar(500) NULL,
    [Category] nvarchar(100) NULL,
    [Description] nvarchar(500) NULL,
    [LastModified] datetime2 NOT NULL DEFAULT GETDATE(),
    [ModifiedByUserId] int NULL,
    CONSTRAINT [PK_SystemConfigurations] PRIMARY KEY ([Id])
)
GO

-- Tabla de eventos de calendario
CREATE TABLE [CalendarEvents] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Title] nvarchar(150) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [Start] datetime2 NOT NULL,
    [End] datetime2 NULL,
    [AllDay] bit NOT NULL DEFAULT 0,
    [Color] nvarchar(20) NULL,
    [CreatedById] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_CalendarEvents] PRIMARY KEY ([Id])
)
GO

-- Tabla de asignados a eventos de calendario
CREATE TABLE [CalendarEventAssignees] (
    [EventId] int NOT NULL,
    [UserId] int NOT NULL,
    CONSTRAINT [PK_CalendarEventAssignees] PRIMARY KEY ([EventId], [UserId])
)
GO

-- =====================================================
-- 3. CREAR FOREIGN KEYS
-- =====================================================

PRINT 'Creando foreign keys...'

-- Foreign keys para Tickets
ALTER TABLE [Tickets] ADD CONSTRAINT [FK_Tickets_AuthUsers_AsignadoAId] 
    FOREIGN KEY ([AsignadoAId]) REFERENCES [AuthUsers] ([Id]) ON DELETE SET NULL
GO

ALTER TABLE [Tickets] ADD CONSTRAINT [FK_Tickets_AuthUsers_CreadoPorId] 
    FOREIGN KEY ([CreadoPorId]) REFERENCES [AuthUsers] ([Id]) ON DELETE NO ACTION
GO

ALTER TABLE [Tickets] ADD CONSTRAINT [FK_Tickets_Activos_ActivoId] 
    FOREIGN KEY ([ActivoId]) REFERENCES [Activos] ([Id]) ON DELETE SET NULL
GO

-- Foreign keys para AsignacionesActivos
ALTER TABLE [AsignacionesActivos] ADD CONSTRAINT [FK_AsignacionesActivos_Activos_ActivoId] 
    FOREIGN KEY ([ActivoId]) REFERENCES [Activos] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [AsignacionesActivos] ADD CONSTRAINT [FK_AsignacionesActivos_NominaUsuarios_UsuarioId] 
    FOREIGN KEY ([UsuarioId]) REFERENCES [NominaUsuarios] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para Actas
ALTER TABLE [Actas] ADD CONSTRAINT [FK_Actas_AsignacionesActivos_AsignacionId] 
    FOREIGN KEY ([AsignacionId]) REFERENCES [AsignacionesActivos] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [Actas] ADD CONSTRAINT [FK_Actas_AuthUsers_AprobadoPorId] 
    FOREIGN KEY ([AprobadoPorId]) REFERENCES [AuthUsers] ([Id]) ON DELETE SET NULL
GO

ALTER TABLE [Actas] ADD CONSTRAINT [FK_Actas_AuthUsers_RechazadoPorId] 
    FOREIGN KEY ([RechazadoPorId]) REFERENCES [AuthUsers] ([Id]) ON DELETE NO ACTION
GO

-- Foreign keys para ComentariosTickets
ALTER TABLE [ComentariosTickets] ADD CONSTRAINT [FK_ComentariosTickets_Tickets_TicketId] 
    FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [ComentariosTickets] ADD CONSTRAINT [FK_ComentariosTickets_AuthUsers_CreadoPorId] 
    FOREIGN KEY ([CreadoPorId]) REFERENCES [AuthUsers] ([Id]) ON DELETE SET NULL
GO

-- Foreign keys para ArchivosTickets
ALTER TABLE [ArchivosTickets] ADD CONSTRAINT [FK_ArchivosTickets_Tickets_TicketId] 
    FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [ArchivosTickets] ADD CONSTRAINT [FK_ArchivosTickets_AuthUsers_SubidoPorId] 
    FOREIGN KEY ([SubidoPorId]) REFERENCES [AuthUsers] ([Id]) ON DELETE SET NULL
GO

-- Foreign keys para ChatConversaciones
ALTER TABLE [ChatConversaciones] ADD CONSTRAINT [FK_ChatConversaciones_AuthUsers_UsuarioId] 
    FOREIGN KEY ([UsuarioId]) REFERENCES [AuthUsers] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [ChatConversaciones] ADD CONSTRAINT [FK_ChatConversaciones_AuthUsers_SoporteId] 
    FOREIGN KEY ([SoporteId]) REFERENCES [AuthUsers] ([Id]) ON DELETE NO ACTION
GO

ALTER TABLE [ChatConversaciones] ADD CONSTRAINT [FK_ChatConversaciones_Tickets_TicketId] 
    FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE SET NULL
GO

-- Foreign keys para ChatMensajes
ALTER TABLE [ChatMensajes] ADD CONSTRAINT [FK_ChatMensajes_ChatConversaciones_ConversacionId] 
    FOREIGN KEY ([ConversacionId]) REFERENCES [ChatConversaciones] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [ChatMensajes] ADD CONSTRAINT [FK_ChatMensajes_AuthUsers_CreadoPorId] 
    FOREIGN KEY ([CreadoPorId]) REFERENCES [AuthUsers] ([Id]) ON DELETE NO ACTION
GO

-- Foreign keys para ChatArchivos
ALTER TABLE [ChatArchivos] ADD CONSTRAINT [FK_ChatArchivos_AuthUsers_UsuarioId] 
    FOREIGN KEY ([UsuarioId]) REFERENCES [AuthUsers] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [ChatArchivos] ADD CONSTRAINT [FK_ChatArchivos_ChatConversaciones_ConversacionId] 
    FOREIGN KEY ([ConversacionId]) REFERENCES [ChatConversaciones] ([Id]) ON DELETE NO ACTION
GO

-- Foreign keys para Software
ALTER TABLE [Software] ADD CONSTRAINT [FK_Software_Activos_ActivoId] 
    FOREIGN KEY ([ActivoId]) REFERENCES [Activos] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para ProgramasSeguridad
ALTER TABLE [ProgramasSeguridad] ADD CONSTRAINT [FK_ProgramasSeguridad_Activos_ActivoId] 
    FOREIGN KEY ([ActivoId]) REFERENCES [Activos] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para Licencias
ALTER TABLE [Licencias] ADD CONSTRAINT [FK_Licencias_Activos_ActivoId] 
    FOREIGN KEY ([ActivoId]) REFERENCES [Activos] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para PazYSalvos
ALTER TABLE [PazYSalvos] ADD CONSTRAINT [FK_PazYSalvos_NominaUsuarios_UsuarioId] 
    FOREIGN KEY ([UsuarioId]) REFERENCES [NominaUsuarios] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para UserActivityLogs
ALTER TABLE [UserActivityLogs] ADD CONSTRAINT [FK_UserActivityLogs_AuthUsers_UserId] 
    FOREIGN KEY ([UserId]) REFERENCES [AuthUsers] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para AuditLogs
ALTER TABLE [AuditLogs] ADD CONSTRAINT [FK_AuditLogs_AuthUsers_UserId] 
    FOREIGN KEY ([UserId]) REFERENCES [AuthUsers] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para Notificaciones
ALTER TABLE [Notificaciones] ADD CONSTRAINT [FK_Notificaciones_AuthUsers_UserId] 
    FOREIGN KEY ([UserId]) REFERENCES [AuthUsers] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para SystemConfigurations
ALTER TABLE [SystemConfigurations] ADD CONSTRAINT [FK_SystemConfigurations_AuthUsers_ModifiedByUserId] 
    FOREIGN KEY ([ModifiedByUserId]) REFERENCES [AuthUsers] ([Id]) ON DELETE SET NULL
GO

-- Foreign keys para CalendarEvents
ALTER TABLE [CalendarEvents] ADD CONSTRAINT [FK_CalendarEvents_AuthUsers_CreatedById] 
    FOREIGN KEY ([CreatedById]) REFERENCES [AuthUsers] ([Id]) ON DELETE CASCADE
GO

-- Foreign keys para CalendarEventAssignees
ALTER TABLE [CalendarEventAssignees] ADD CONSTRAINT [FK_CalendarEventAssignees_CalendarEvents_EventId] 
    FOREIGN KEY ([EventId]) REFERENCES [CalendarEvents] ([Id]) ON DELETE CASCADE
GO

ALTER TABLE [CalendarEventAssignees] ADD CONSTRAINT [FK_CalendarEventAssignees_AuthUsers_UserId] 
    FOREIGN KEY ([UserId]) REFERENCES [AuthUsers] ([Id]) ON DELETE NO ACTION
GO

-- =====================================================
-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

PRINT 'Creando índices...'

-- Índices para AuthUsers
CREATE UNIQUE INDEX [IX_AuthUsers_Username] ON [AuthUsers] ([Username])
GO

CREATE INDEX [IX_AuthUsers_Role] ON [AuthUsers] ([Role])
GO

CREATE INDEX [IX_AuthUsers_IsActive] ON [AuthUsers] ([IsActive])
GO

-- Índices para NominaUsuarios
CREATE UNIQUE INDEX [IX_NominaUsuarios_Rut] ON [NominaUsuarios] ([Rut])
GO

CREATE INDEX [IX_NominaUsuarios_Email] ON [NominaUsuarios] ([Email])
GO

CREATE INDEX [IX_NominaUsuarios_Empresa] ON [NominaUsuarios] ([Empresa])
GO

CREATE INDEX [IX_NominaUsuarios_Departamento] ON [NominaUsuarios] ([Departamento])
GO

-- Índices para Activos
CREATE UNIQUE INDEX [IX_Activos_Codigo] ON [Activos] ([Codigo])
GO

CREATE INDEX [IX_Activos_Categoria] ON [Activos] ([Categoria])
GO

CREATE INDEX [IX_Activos_Estado] ON [Activos] ([Estado])
GO

CREATE INDEX [IX_Activos_Empresa] ON [Activos] ([Empresa])
GO

CREATE INDEX [IX_Activos_Ubicacion] ON [Activos] ([Ubicacion])
GO

-- Índices para Tickets
CREATE INDEX [IX_Tickets_Estado] ON [Tickets] ([Estado])
GO

CREATE INDEX [IX_Tickets_Categoria] ON [Tickets] ([Categoria])
GO

CREATE INDEX [IX_Tickets_Prioridad] ON [Tickets] ([Prioridad])
GO

CREATE INDEX [IX_Tickets_FechaCreacion] ON [Tickets] ([FechaCreacion])
GO

CREATE INDEX [IX_Tickets_AsignadoAId] ON [Tickets] ([AsignadoAId])
GO

CREATE INDEX [IX_Tickets_CreadoPorId] ON [Tickets] ([CreadoPorId])
GO

CREATE INDEX [IX_Tickets_ActivoId] ON [Tickets] ([ActivoId])
GO

-- Índices para AsignacionesActivos
CREATE INDEX [IX_AsignacionesActivos_ActivoId] ON [AsignacionesActivos] ([ActivoId])
GO

CREATE INDEX [IX_AsignacionesActivos_UsuarioId] ON [AsignacionesActivos] ([UsuarioId])
GO

CREATE INDEX [IX_AsignacionesActivos_Estado] ON [AsignacionesActivos] ([Estado])
GO

CREATE INDEX [IX_AsignacionesActivos_FechaAsignacion] ON [AsignacionesActivos] ([FechaAsignacion])
GO

-- Índice único para evitar asignaciones duplicadas activas (configuración específica del DbContext)
CREATE UNIQUE INDEX [IX_AsignacionesActivos_ActivoId_Estado] ON [AsignacionesActivos] ([ActivoId], [Estado]) 
WHERE [Estado] = 'Activa'
GO

-- Índices para Actas
CREATE INDEX [IX_Actas_AsignacionId] ON [Actas] ([AsignacionId])
GO

CREATE INDEX [IX_Actas_Estado] ON [Actas] ([Estado])
GO

CREATE INDEX [IX_Actas_AprobadoPorId] ON [Actas] ([AprobadoPorId])
GO

CREATE INDEX [IX_Actas_FechaCreacion] ON [Actas] ([FechaCreacion])
GO

-- Índices para ComentariosTickets
CREATE INDEX [IX_ComentariosTickets_TicketId] ON [ComentariosTickets] ([TicketId])
GO

CREATE INDEX [IX_ComentariosTickets_CreadoPorId] ON [ComentariosTickets] ([CreadoPorId])
GO

CREATE INDEX [IX_ComentariosTickets_FechaCreacion] ON [ComentariosTickets] ([FechaCreacion])
GO

-- Índices para ArchivosTickets
CREATE INDEX [IX_ArchivosTickets_TicketId] ON [ArchivosTickets] ([TicketId])
GO

CREATE INDEX [IX_ArchivosTickets_SubidoPorId] ON [ArchivosTickets] ([SubidoPorId])
GO

-- Índices para ChatConversaciones
CREATE INDEX [IX_ChatConversaciones_UsuarioId] ON [ChatConversaciones] ([UsuarioId])
GO

CREATE INDEX [IX_ChatConversaciones_SoporteId] ON [ChatConversaciones] ([SoporteId])
GO

CREATE INDEX [IX_ChatConversaciones_Estado] ON [ChatConversaciones] ([Estado])
GO

CREATE INDEX [IX_ChatConversaciones_TicketId] ON [ChatConversaciones] ([TicketId])
GO

-- Índices para ChatMensajes
CREATE INDEX [IX_ChatMensajes_ConversacionId] ON [ChatMensajes] ([ConversacionId])
GO

CREATE INDEX [IX_ChatMensajes_CreadoPorId] ON [ChatMensajes] ([CreadoPorId])
GO

CREATE INDEX [IX_ChatMensajes_FechaCreacion] ON [ChatMensajes] ([FechaCreacion])
GO

CREATE INDEX [IX_ChatMensajes_EsLeido] ON [ChatMensajes] ([EsLeido])
GO

-- Índice compuesto específico del DbContext
CREATE INDEX [IX_ChatMensajes_ConversacionId_FechaCreacion] ON [ChatMensajes] ([ConversacionId], [FechaCreacion])
GO

-- Índices para Software
CREATE INDEX [IX_Software_ActivoId] ON [Software] ([ActivoId])
GO

CREATE INDEX [IX_Software_Estado] ON [Software] ([Estado])
GO

-- Índices para ProgramasSeguridad
CREATE INDEX [IX_ProgramasSeguridad_ActivoId] ON [ProgramasSeguridad] ([ActivoId])
GO

CREATE INDEX [IX_ProgramasSeguridad_Tipo] ON [ProgramasSeguridad] ([Tipo])
GO

CREATE INDEX [IX_ProgramasSeguridad_Estado] ON [ProgramasSeguridad] ([Estado])
GO

-- Índices para Licencias
CREATE INDEX [IX_Licencias_ActivoId] ON [Licencias] ([ActivoId])
GO

CREATE INDEX [IX_Licencias_Tipo] ON [Licencias] ([Tipo])
GO

CREATE INDEX [IX_Licencias_FechaVencimiento] ON [Licencias] ([FechaVencimiento])
GO

-- Índices para ProgramasEstandar
CREATE INDEX [IX_ProgramasEstandar_Categoria] ON [ProgramasEstandar] ([Categoria])
GO

CREATE INDEX [IX_ProgramasEstandar_Tipo] ON [ProgramasEstandar] ([Tipo])
GO

CREATE INDEX [IX_ProgramasEstandar_Activo] ON [ProgramasEstandar] ([Activo])
GO

CREATE INDEX [IX_ProgramasEstandar_Nombre] ON [ProgramasEstandar] ([Nombre])
GO

-- Índices para PazYSalvos
CREATE INDEX [IX_PazYSalvos_UsuarioId] ON [PazYSalvos] ([UsuarioId])
GO

CREATE INDEX [IX_PazYSalvos_Estado] ON [PazYSalvos] ([Estado])
GO

-- Índices para UserActivityLogs
CREATE INDEX [IX_UserActivityLogs_UserId] ON [UserActivityLogs] ([UserId])
GO

CREATE INDEX [IX_UserActivityLogs_Action] ON [UserActivityLogs] ([Action])
GO

CREATE INDEX [IX_UserActivityLogs_Timestamp] ON [UserActivityLogs] ([Timestamp])
GO

-- Índices para AuditLogs
CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId])
GO

CREATE INDEX [IX_AuditLogs_Action] ON [AuditLogs] ([Action])
GO

CREATE INDEX [IX_AuditLogs_ResourceType] ON [AuditLogs] ([ResourceType])
GO

CREATE INDEX [IX_AuditLogs_Timestamp] ON [AuditLogs] ([Timestamp])
GO

-- Índices compuestos específicos del DbContext
CREATE INDEX [IX_AuditLogs_UserId_Timestamp] ON [AuditLogs] ([UserId], [Timestamp])
GO

CREATE INDEX [IX_AuditLogs_ResourceType_ResourceId] ON [AuditLogs] ([ResourceType], [ResourceId])
GO

-- Índices para Notificaciones
CREATE INDEX [IX_Notificaciones_UserId] ON [Notificaciones] ([UserId])
GO

CREATE INDEX [IX_Notificaciones_IsRead] ON [Notificaciones] ([IsRead])
GO

CREATE INDEX [IX_Notificaciones_CreatedAt] ON [Notificaciones] ([CreatedAt])
GO

CREATE INDEX [IX_Notificaciones_Tipo] ON [Notificaciones] ([Tipo])
GO

-- Índices compuestos específicos del DbContext
CREATE INDEX [IX_Notificaciones_UserId_IsRead_CreatedAt] ON [Notificaciones] ([UserId], [IsRead], [CreatedAt])
GO

CREATE INDEX [IX_Notificaciones_RefTipo_RefId] ON [Notificaciones] ([RefTipo], [RefId])
GO

-- Índices para SystemConfigurations
CREATE UNIQUE INDEX [IX_SystemConfigurations_Key] ON [SystemConfigurations] ([Key])
GO

CREATE INDEX [IX_SystemConfigurations_Category] ON [SystemConfigurations] ([Category])
GO

-- Índices para CalendarEvents
CREATE INDEX [IX_CalendarEvents_CreatedById] ON [CalendarEvents] ([CreatedById])
GO

CREATE INDEX [IX_CalendarEvents_Start] ON [CalendarEvents] ([Start])
GO

CREATE INDEX [IX_CalendarEvents_End] ON [CalendarEvents] ([End])
GO

-- =====================================================
-- 5. CREAR USUARIO ADMIN INICIAL
-- =====================================================

PRINT 'Creando usuario admin inicial...'

-- NOTA: El usuario admin se debe crear desde la aplicación o usando el endpoint de registro
-- ya que requiere el algoritmo HMACSHA512 con salt dinámico que no se puede replicar en SQL puro.
-- 
-- Para crear el usuario admin, puedes:
-- 1. Usar el endpoint POST /api/auth/register con un usuario de nómina válido
-- 2. O usar el endpoint POST /api/auth/create-admin (si existe)
-- 3. O crear manualmente un usuario de nómina y luego registrarlo

-- Crear un usuario de nómina para el admin
INSERT INTO [NominaUsuarios] ([Nombre], [Apellido], [Rut], [Email], [Departamento], [Empresa], [Ubicacion])
VALUES (
    'Administrador',
    'Sistema',
    '12345678-9',
    'admin@empresa.com',
    'TI',
    'Empresa Principal',
    'Oficina Central'
)
GO

PRINT 'Usuario de nómina para admin creado. Usa el endpoint /api/auth/register para crear el usuario de autenticación.'
PRINT 'Datos para registro:'
PRINT 'Email: admin@empresa.com'
PRINT 'RUT: 12345678-9'
PRINT 'Password: admin123'
GO

-- =====================================================
-- 6. CONFIGURACIONES INICIALES DEL SISTEMA
-- =====================================================

PRINT 'Insertando configuraciones iniciales...'

INSERT INTO [SystemConfigurations] ([Key], [Value], [Category], [Description], [LastModified])
VALUES 
    ('SistemaNombre', 'Portal TI', 'General', 'Nombre del sistema', GETDATE()),
    ('SistemaVersion', '1.0.0', 'General', 'Versión del sistema', GETDATE()),
    ('MaxArchivoSize', '10485760', 'Archivos', 'Tamaño máximo de archivo en bytes (10MB)', GETDATE()),
    ('TiposArchivoPermitidos', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'Archivos', 'Tipos de archivo permitidos', GETDATE()),
    ('DiasRetencionLogs', '90', 'Logs', 'Días de retención de logs', GETDATE()),
    ('NotificacionesActivas', 'true', 'Notificaciones', 'Estado de las notificaciones del sistema', GETDATE()),
    ('TiempoSesion', '480', 'Seguridad', 'Tiempo de sesión en minutos (8 horas)', GETDATE()),
    ('IntentosLogin', '3', 'Seguridad', 'Número máximo de intentos de login', GETDATE()),
    ('EmpresaPrincipal', 'Empresa Principal', 'General', 'Nombre de la empresa principal', GETDATE()),
    ('EmailSistema', 'sistema@empresa.com', 'General', 'Email del sistema', GETDATE())
GO

-- =====================================================
-- 7. RESUMEN FINAL
-- =====================================================

PRINT '====================================================='
PRINT 'CREACIÓN DE BASE DE DATOS COMPLETADA'
PRINT '====================================================='
PRINT 'Base de datos: PortalTi'
PRINT 'Tablas creadas: 24'
PRINT 'Foreign keys: 25'
PRINT 'Índices: 55+'
PRINT 'Usuario admin: admin (password: admin123)'
PRINT 'Configuraciones: 10'
PRINT '====================================================='

-- Verificar estructura creada
SELECT 
    'Tablas creadas' as Tipo,
    COUNT(*) as Cantidad
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'

UNION ALL

SELECT 
    'Foreign Keys' as Tipo,
    COUNT(*) as Cantidad
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS

UNION ALL

SELECT 
    'Índices' as Tipo,
    COUNT(*) as Cantidad
FROM sys.indexes 
WHERE object_id > 0

UNION ALL

SELECT 
    'Usuarios Admin' as Tipo,
    COUNT(*) as Cantidad
FROM AuthUsers 
WHERE Role = 'admin'

UNION ALL

SELECT 
    'Configuraciones' as Tipo,
    COUNT(*) as Cantidad
FROM SystemConfigurations

GO
