-- =====================================================
-- SCRIPT PARA AGREGAR USUARIO DE PRUEBA "RAÚL ROJAS"
-- =====================================================

USE [PortalTi]
GO

PRINT 'Agregando usuario de prueba Raúl Rojas...'

-- 1. Agregar usuario a la nómina
INSERT INTO [NominaUsuarios] ([Nombre], [Apellido], [Rut], [Email], [Departamento], [Empresa], [Ubicacion])
VALUES (
    'Raúl',
    'Rojas', 
    '12345678-9',
    'raul.rojas@empresa.com',
    'Ventas',
    'Empresa Principal',
    'Oficina Central'
)
GO

-- Obtener el ID del usuario creado
DECLARE @UsuarioId INT = SCOPE_IDENTITY()
PRINT 'Usuario creado con ID: ' + CAST(@UsuarioId AS VARCHAR(10))

-- 2. Crear algunos activos de prueba
INSERT INTO [Activos] ([Categoria], [Codigo], [Estado], [Ubicacion], [NombreEquipo], [TipoEquipo], [Procesador], [SistemaOperativo], [Serie], [Ram], [Marca], [Modelo], [Empresa])
VALUES 
('Equipos', 'EQ-001', 'Activo', 'Oficina Central', 'PC Raúl Rojas', 'Desktop', 'Intel Core i5', 'Windows 11', 'SN001', '16GB', 'HP', 'Pavilion', 'Empresa Principal'),
('Móviles', 'MOB-001', 'Activo', 'Oficina Central', 'iPhone Raúl', 'Smartphone', 'A15 Bionic', 'iOS 17', 'SN002', '6GB', 'Apple', 'iPhone 13', 'Empresa Principal'),
('Monitores', 'MON-001', 'Activo', 'Oficina Central', 'Monitor Raúl', 'Monitor', 'N/A', 'N/A', 'SN003', 'N/A', 'Dell', 'UltraSharp 24"', 'Empresa Principal')
GO

-- Obtener los IDs de los activos creados
DECLARE @Activo1Id INT = (SELECT Id FROM [Activos] WHERE [Codigo] = 'EQ-001')
DECLARE @Activo2Id INT = (SELECT Id FROM [Activos] WHERE [Codigo] = 'MOB-001')
DECLARE @Activo3Id INT = (SELECT Id FROM [Activos] WHERE [Codigo] = 'MON-001')

PRINT 'Activos creados con IDs: ' + CAST(@Activo1Id AS VARCHAR(10)) + ', ' + CAST(@Activo2Id AS VARCHAR(10)) + ', ' + CAST(@Activo3Id AS VARCHAR(10))

-- 3. Asignar activos al usuario
INSERT INTO [AsignacionesActivos] ([ActivoId], [UsuarioId], [FechaAsignacion], [Estado], [AsignadoPor])
VALUES 
(@Activo1Id, @UsuarioId, GETDATE(), 'Activa', 'Sistema'),
(@Activo2Id, @UsuarioId, GETDATE(), 'Activa', 'Sistema'),
(@Activo3Id, @UsuarioId, GETDATE(), 'Activa', 'Sistema')
GO

-- 4. Crear algunos tickets de prueba para el usuario
INSERT INTO [Tickets] ([Titulo], [Descripcion], [NombreSolicitante], [EmailSolicitante], [TelefonoSolicitante], [Empresa], [Departamento], [Categoria], [Prioridad], [Estado], [FechaCreacion])
VALUES 
('Problema con impresora', 'La impresora no imprime correctamente, las hojas salen con manchas', 'Raúl Rojas', 'raul.rojas@empresa.com', '+56912345678', 'Empresa Principal', 'Ventas', 'Hardware', 'Media', 'Pendiente', GETDATE()),
('Solicitud de software', 'Necesito instalar Adobe Photoshop para editar imágenes', 'Raúl Rojas', 'raul.rojas@empresa.com', '+56912345678', 'Empresa Principal', 'Ventas', 'Software', 'Baja', 'Pendiente', GETDATE()),
('Problema de red', 'No puedo conectarme a la red WiFi de la oficina', 'Raúl Rojas', 'raul.rojas@empresa.com', '+56912345678', 'Empresa Principal', 'Ventas', 'Red', 'Alta', 'Pendiente', GETDATE())
GO

-- 5. Crear usuario de autenticación (si no existe)
IF NOT EXISTS (SELECT 1 FROM [AuthUsers] WHERE [Username] = 'raul.rojas@empresa.com')
BEGIN
    -- Crear hash de contraseña para 'password123'
    DECLARE @Password NVARCHAR(50) = 'password123'
    DECLARE @Salt VARBINARY(16) = NEWID()
    DECLARE @PasswordHash VARBINARY(64)
    
    -- Simular hash de contraseña (en producción usar HMACSHA512)
    SET @PasswordHash = HASHBYTES('SHA2_256', @Password + CAST(@Salt AS NVARCHAR(36)))
    
    INSERT INTO [AuthUsers] ([Username], [PasswordHash], [PasswordSalt], [Role], [IsActive], [CreatedAt])
    VALUES ('raul.rojas@empresa.com', @PasswordHash, @Salt, 'usuario', 1, GETDATE())
    
    PRINT 'Usuario de autenticación creado'
END
ELSE
BEGIN
    PRINT 'Usuario de autenticación ya existe'
END

-- 6. Verificar datos creados
PRINT '====================================================='
PRINT 'VERIFICACIÓN DE DATOS CREADOS'
PRINT '====================================================='

SELECT 'Usuarios de nómina' as Tipo, COUNT(*) as Cantidad FROM [NominaUsuarios] WHERE [Email] = 'raul.rojas@empresa.com'
UNION ALL
SELECT 'Activos asignados' as Tipo, COUNT(*) as Cantidad FROM [AsignacionesActivos] WHERE [UsuarioId] = @UsuarioId AND [Estado] = 'Activa'
UNION ALL
SELECT 'Tickets creados' as Tipo, COUNT(*) as Cantidad FROM [Tickets] WHERE [EmailSolicitante] = 'raul.rojas@empresa.com'
UNION ALL
SELECT 'Usuarios de auth' as Tipo, COUNT(*) as Cantidad FROM [AuthUsers] WHERE [Username] = 'raul.rojas@empresa.com'

PRINT '====================================================='
PRINT 'USUARIO DE PRUEBA CREADO EXITOSAMENTE'
PRINT 'Email: raul.rojas@empresa.com'
PRINT 'Password: password123'
PRINT '====================================================='
