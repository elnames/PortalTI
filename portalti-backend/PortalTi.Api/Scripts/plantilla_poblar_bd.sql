-- =====================================================
-- SCRIPT DE POBLACIÓN DE BASE DE DATOS PORTAL TI
-- =====================================================
USE [PortalTi]
GO

PRINT '====================================================='
PRINT 'INICIANDO POBLACIÓN DE BASE DE DATOS'
PRINT '====================================================='

-- =====================================================
-- LIMPIEZA DE DATOS EXISTENTES
-- =====================================================
PRINT 'Limpiando tablas existentes...'

-- Deshabilitar restricciones de clave foránea temporalmente
ALTER TABLE [AsignacionesActivos] NOCHECK CONSTRAINT ALL
ALTER TABLE [Actas] NOCHECK CONSTRAINT ALL
ALTER TABLE [ComentariosTickets] NOCHECK CONSTRAINT ALL
ALTER TABLE [Tickets] NOCHECK CONSTRAINT ALL
ALTER TABLE [ProgramasLicencias] NOCHECK CONSTRAINT ALL
ALTER TABLE [Licencias] NOCHECK CONSTRAINT ALL
ALTER TABLE [AuditLogs] NOCHECK CONSTRAINT ALL
ALTER TABLE [UserActivityLogs] NOCHECK CONSTRAINT ALL
ALTER TABLE [Notificaciones] NOCHECK CONSTRAINT ALL
ALTER TABLE [PazYSalvos] NOCHECK CONSTRAINT ALL

-- Limpiar tablas en orden correcto
DELETE FROM [PazYSalvos]
DELETE FROM [Notificaciones]
DELETE FROM [UserActivityLogs]
DELETE FROM [AuditLogs]
DELETE FROM [ComentariosTickets]
DELETE FROM [Tickets]
DELETE FROM [Actas]
DELETE FROM [AsignacionesActivos]
DELETE FROM [ProgramasLicencias]
DELETE FROM [Licencias]
DELETE FROM [ProgramasEstandar]
DELETE FROM [Activos]
DELETE FROM [NominaUsuarios]

-- Resetear contadores de identidad
DBCC CHECKIDENT ('NominaUsuarios', RESEED, 0)
DBCC CHECKIDENT ('Activos', RESEED, 0)
DBCC CHECKIDENT ('ProgramasEstandar', RESEED, 0)
DBCC CHECKIDENT ('Licencias', RESEED, 0)
DBCC CHECKIDENT ('ProgramasLicencias', RESEED, 0)
DBCC CHECKIDENT ('AsignacionesActivos', RESEED, 0)
DBCC CHECKIDENT ('Actas', RESEED, 0)
DBCC CHECKIDENT ('Tickets', RESEED, 0)
DBCC CHECKIDENT ('ComentariosTickets', RESEED, 0)
DBCC CHECKIDENT ('AuditLogs', RESEED, 0)
DBCC CHECKIDENT ('UserActivityLogs', RESEED, 0)
DBCC CHECKIDENT ('Notificaciones', RESEED, 0)
DBCC CHECKIDENT ('PazYSalvos', RESEED, 0)

-- Rehabilitar restricciones de clave foránea
ALTER TABLE [AsignacionesActivos] CHECK CONSTRAINT ALL
ALTER TABLE [Actas] CHECK CONSTRAINT ALL
ALTER TABLE [ComentariosTickets] CHECK CONSTRAINT ALL
ALTER TABLE [Tickets] CHECK CONSTRAINT ALL
ALTER TABLE [ProgramasLicencias] CHECK CONSTRAINT ALL
ALTER TABLE [Licencias] CHECK CONSTRAINT ALL
ALTER TABLE [AuditLogs] CHECK CONSTRAINT ALL
ALTER TABLE [UserActivityLogs] CHECK CONSTRAINT ALL
ALTER TABLE [Notificaciones] CHECK CONSTRAINT ALL
ALTER TABLE [PazYSalvos] CHECK CONSTRAINT ALL

PRINT 'Tablas limpiadas exitosamente.'

-- =====================================================
-- PARTE 1: CREAR USUARIOS DE NÓMINA
-- =====================================================
PRINT 'PARTE 1: Creando usuarios de nómina...'

INSERT INTO [NominaUsuarios] ([Nombre], [Apellido], [Rut], [Cargo], [Area], [Email], [Empresa], [Ubicacion])
VALUES
('Juan', 'Pérez', '12.345.678-9', 'Desarrollador', 'IT', 'juan.perez@vicsa.cl', 'Vicsa', 'Huechuraba'),
('María', 'González', '98.765.432-1', 'Analista', 'Finanzas', 'maria.gonzalez@vicsa.cl', 'Vicsa', 'Huechuraba')
-- ... continuar con todos los 214 usuarios del CSV
GO

PRINT 'Usuarios de nómina creados exitosamente'
GO

-- =====================================================
-- PARTE 2: CREAR PROGRAMAS ESTÁNDAR
-- =====================================================
PRINT 'PARTE 2: Creando programas estándar...'

INSERT INTO [ProgramasEstandar] ([Nombre], [Categoria], [Tipo], [Descripcion], [VersionRecomendada], [Activo])
VALUES
('Microsoft Office 365', 'Productividad', 'Suite', 'Suite de productividad de Microsoft', '2023', 1),
('Adobe Photoshop', 'Diseño', 'Software', 'Editor de imágenes profesional', '2024', 1),
('Google Chrome', 'Navegación', 'Navegador', 'Navegador web de Google', '120', 1),
('Windows Defender', 'Seguridad', 'Antivirus', 'Antivirus integrado de Windows', 'Actual', 1),
('TeamViewer', 'Remoto', 'Software', 'Software de acceso remoto', '15', 1)

PRINT 'Programas estándar creados exitosamente'

-- =====================================================
-- PARTE 3: CREAR ACTIVOS (EQUIPOS)
-- =====================================================
PRINT 'PARTE 3: Creando activos...'

INSERT INTO [Activos] ([Codigo], [Categoria], [Estado], [Ubicacion], [NombreEquipo], [TipoEquipo], [Procesador], [SistemaOperativo], [Serie], [Ram], [Marca], [Modelo], [Empresa])
VALUES
('EQUIPO-001', 'Equipos', 'Activo', 'Huechuraba', 'EQUIPO-001', 'Desktop', 'Intel Core i7', 'Windows 11', 'ABC123', '16GB', 'HP', 'ProBook 450', 'Vicsa'),
('EQUIPO-002', 'Equipos', 'Activo', 'Huechuraba', 'EQUIPO-002', 'Laptop', 'AMD Ryzen 5', 'Windows 11', 'DEF456', '8GB', 'Lenovo', 'ThinkPad E15', 'Vicsa')
-- ... continuar con todos los 214 activos del CSV
GO

PRINT 'Activos creados exitosamente'
GO

-- =====================================================
-- PARTE 4: CREAR LICENCIAS
-- =====================================================
PRINT 'PARTE 4: Creando licencias...'

INSERT INTO [Licencias] ([Software], [Tipo], [NumeroLicencia], [UsuarioAsignado], [FechaInicio], [FechaVencimiento], [Notas], [ActivoId])
VALUES
('Microsoft Office 365', 'Comercial', 'OFF-2024-001', 'juan.perez@vicsa.cl', '2024-01-01', '2024-12-31', 'Licencia anual', 1),
('Adobe Photoshop', 'Comercial', 'PS-2024-001', 'maria.gonzalez@vicsa.cl', '2024-01-01', '2024-12-31', 'Licencia anual', 2)
-- ... continuar con licencias para cada activo
GO

PRINT 'Licencias creadas exitosamente'
GO

-- =====================================================
-- PARTE 5: CREAR ASIGNACIONES USUARIO-ACTIVO
-- =====================================================
PRINT 'PARTE 5: Creando asignaciones usuario-activo...'

-- Crear asignaciones 1:1 usando ROW_NUMBER()
WITH UsuariosConNumero AS (
    SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) as RowNum
    FROM [NominaUsuarios] 
),
ActivosConNumero AS (
    SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) as RowNum
    FROM [Activos] 
)
INSERT INTO [AsignacionesActivos] ([ActivoId], [UsuarioId], [FechaAsignacion], [Estado], [AsignadoPor])
SELECT 
    a.Id as ActivoId,
    u.Id as UsuarioId,
    GETDATE() as FechaAsignacion,
    'Activa' as Estado,
    'Sistema' as AsignadoPor
FROM UsuariosConNumero u
INNER JOIN ActivosConNumero a ON u.RowNum = a.RowNum

PRINT 'Asignaciones creadas exitosamente'

-- =====================================================
-- PARTE 6: CREAR ACTAS
-- =====================================================
PRINT 'PARTE 6: Creando actas...'

INSERT INTO [Actas] ([ActivoId], [Tipo], [Estado], [FechaCreacion], [CreadoPor], [Observaciones])
SELECT 
    aa.ActivoId,
    'Entrega',
    'Completada',
    GETDATE(),
    1,
    'Acta de entrega generada automáticamente'
FROM [AsignacionesActivos] aa
WHERE aa.Estado = 'Activa'

PRINT 'Actas creadas exitosamente'

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
PRINT '====================================================='
PRINT 'POBLACIÓN COMPLETADA EXITOSAMENTE'
PRINT '====================================================='

-- Verificación con variables para evitar subconsultas en PRINT
DECLARE @TotalUsuarios INT, @TotalActivos INT, @TotalAsignaciones INT, @TotalActas INT, @TotalProgramas INT, @TotalLicencias INT

SELECT @TotalUsuarios = COUNT(*) FROM [NominaUsuarios]
SELECT @TotalActivos = COUNT(*) FROM [Activos]
SELECT @TotalAsignaciones = COUNT(*) FROM [AsignacionesActivos] WHERE [Estado] = 'Activa'
SELECT @TotalActas = COUNT(*) FROM [Actas]
SELECT @TotalProgramas = COUNT(*) FROM [ProgramasEstandar]
SELECT @TotalLicencias = COUNT(*) FROM [Licencias]

PRINT 'Usuarios de nómina creados: ' + CAST(@TotalUsuarios AS VARCHAR(10))
PRINT 'Activos creados: ' + CAST(@TotalActivos AS VARCHAR(10))
PRINT 'Asignaciones creadas: ' + CAST(@TotalAsignaciones AS VARCHAR(10))
PRINT 'Actas creadas: ' + CAST(@TotalActas AS VARCHAR(10))
PRINT 'Programas creados: ' + CAST(@TotalProgramas AS VARCHAR(10))
PRINT 'Licencias creadas: ' + CAST(@TotalLicencias AS VARCHAR(10))
PRINT '====================================================='