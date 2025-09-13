-- =====================================================
-- SCRIPT PARA ASIGNAR TODOS LOS SUBROLES DE PAZ Y SALVO AL ADMIN
-- Este script asigna todos los subroles disponibles al usuario administrador
-- =====================================================

SET QUOTED_IDENTIFIER ON
GO

USE [PortalTi]
GO

PRINT '====================================================='
PRINT 'ASIGNANDO SUBROLES DE PAZ Y SALVO AL ADMINISTRADOR'
PRINT '====================================================='

-- Verificar que existe el usuario admin
IF NOT EXISTS (SELECT 1 FROM [AuthUsers] WHERE [Username] = 'admin' AND [Role] = 'admin')
BEGIN
    PRINT 'ERROR: No se encontró el usuario admin. Ejecuta primero el script CREAR_ADMIN.sql'
    RETURN
END
GO

-- Obtener el ID del usuario admin
DECLARE @AdminUserId INT = (SELECT [Id] FROM [AuthUsers] WHERE [Username] = 'admin' AND [Role] = 'admin')

IF @AdminUserId IS NULL
BEGIN
    PRINT 'ERROR: No se pudo obtener el ID del usuario admin'
    RETURN
END

PRINT 'Usuario admin encontrado con ID: ' + CAST(@AdminUserId AS NVARCHAR(10))

-- =====================================================
-- 1. CREAR SUBROLES SI NO EXISTEN
-- =====================================================

PRINT 'Creando subroles de Paz y Salvo...'

-- Insertar subroles si no existen (usando nombres que espera el frontend)
INSERT INTO [PazYSalvoSubRoles] ([Nombre], [Descripcion], [Orden], [Obligatorio], [PermiteDelegacion], [IsActive], [CreatedAt])
SELECT 'Jefatura Directa', 'Jefe directo del empleado que puede aprobar su paz y salvo', 1, 1, 1, 1, GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM [PazYSalvoSubRoles] WHERE [Nombre] = 'Jefatura Directa')

INSERT INTO [PazYSalvoSubRoles] ([Nombre], [Descripcion], [Orden], [Obligatorio], [PermiteDelegacion], [IsActive], [CreatedAt])
SELECT 'RRHH', 'Recursos Humanos - Gestión completa de paz y salvo', 2, 1, 1, 1, GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM [PazYSalvoSubRoles] WHERE [Nombre] = 'RRHH')

INSERT INTO [PazYSalvoSubRoles] ([Nombre], [Descripcion], [Orden], [Obligatorio], [PermiteDelegacion], [IsActive], [CreatedAt])
SELECT 'TI', 'Tecnología de la Información - Revisión de activos tecnológicos', 3, 1, 1, 1, GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM [PazYSalvoSubRoles] WHERE [Nombre] = 'TI')

INSERT INTO [PazYSalvoSubRoles] ([Nombre], [Descripcion], [Orden], [Obligatorio], [PermiteDelegacion], [IsActive], [CreatedAt])
SELECT 'Contabilidad', 'Contabilidad - Verificación de aspectos financieros', 4, 1, 1, 1, GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM [PazYSalvoSubRoles] WHERE [Nombre] = 'Contabilidad')

INSERT INTO [PazYSalvoSubRoles] ([Nombre], [Descripcion], [Orden], [Obligatorio], [PermiteDelegacion], [IsActive], [CreatedAt])
SELECT 'Gerencia Finanzas', 'Gerencia de Finanzas - Aprobación final financiera', 5, 1, 1, 1, GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM [PazYSalvoSubRoles] WHERE [Nombre] = 'Gerencia Finanzas')

PRINT 'Subroles creados/verificados exitosamente'

-- =====================================================
-- 2. ASIGNAR TODOS LOS SUBROLES AL ADMIN
-- =====================================================

PRINT 'Asignando todos los subroles al administrador...'

-- Eliminar asignaciones existentes del admin (si las hay)
DELETE FROM [PazYSalvoRoleAssignments] 
WHERE [UserId] = @AdminUserId

-- Asignar Jefatura Directa
INSERT INTO [PazYSalvoRoleAssignments] ([Departamento], [Rol], [UserId], [IsActive], [CreatedAt])
VALUES ('General', 'Jefatura Directa', @AdminUserId, 1, GETDATE())

-- Asignar RRHH
INSERT INTO [PazYSalvoRoleAssignments] ([Departamento], [Rol], [UserId], [IsActive], [CreatedAt])
VALUES ('RRHH', 'RRHH', @AdminUserId, 1, GETDATE())

-- Asignar TI
INSERT INTO [PazYSalvoRoleAssignments] ([Departamento], [Rol], [UserId], [IsActive], [CreatedAt])
VALUES ('IT', 'TI', @AdminUserId, 1, GETDATE())

-- Asignar Contabilidad
INSERT INTO [PazYSalvoRoleAssignments] ([Departamento], [Rol], [UserId], [IsActive], [CreatedAt])
VALUES ('Finanzas', 'Contabilidad', @AdminUserId, 1, GETDATE())

-- Asignar Gerencia Finanzas
INSERT INTO [PazYSalvoRoleAssignments] ([Departamento], [Rol], [UserId], [IsActive], [CreatedAt])
VALUES ('Finanzas', 'Gerencia Finanzas', @AdminUserId, 1, GETDATE())

PRINT 'Subroles asignados al administrador exitosamente'

-- =====================================================
-- 3. VERIFICAR ASIGNACIONES
-- =====================================================

PRINT 'Verificando asignaciones...'

SELECT 
    ra.[Id],
    ra.[Departamento],
    ra.[Rol],
    u.[Username] as [Usuario],
    u.[Role] as [RolUsuario],
    ra.[IsActive],
    ra.[CreatedAt]
FROM [PazYSalvoRoleAssignments] ra
INNER JOIN [AuthUsers] u ON ra.[UserId] = u.[Id]
WHERE ra.[UserId] = @AdminUserId
ORDER BY ra.[Rol]

-- =====================================================
-- 4. RESUMEN FINAL
-- =====================================================

PRINT '====================================================='
PRINT 'ASIGNACIÓN DE SUBROLES COMPLETADA'
PRINT '====================================================='
PRINT 'Usuario admin ID: ' + CAST(@AdminUserId AS NVARCHAR(10))
PRINT 'Subroles asignados: 5'
PRINT '- Jefatura Directa (General)'
PRINT '- RRHH (RRHH)'
PRINT '- TI (IT)'
PRINT '- Contabilidad (Finanzas)'
PRINT '- Gerencia Finanzas (Finanzas)'
PRINT '====================================================='
PRINT 'El administrador ahora tiene acceso a todas las'
PRINT 'funcionalidades de Paz y Salvo del sistema.'
PRINT '====================================================='

GO
