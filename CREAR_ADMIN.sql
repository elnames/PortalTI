-- =====================================================
-- SCRIPT SIMPLE PARA CREAR USUARIO ADMIN
-- Username: admin
-- Password: admin
-- =====================================================

USE [PortalTi]
GO

-- Eliminar usuario admin existente si existe
IF EXISTS (SELECT 1 FROM AuthUsers WHERE Username = 'admin')
BEGIN
    DELETE FROM AuthUsers WHERE Username = 'admin'
    PRINT 'Usuario admin existente eliminado.'
END

-- Crear usuario admin con hash correcto
INSERT INTO [AuthUsers] ([Username], [PasswordHash], [PasswordSalt], [Role], [IsActive], [CreatedAt])
VALUES (
    'admin',
    0x7CB9970362E63989DE004A903BCEBC06720BB1CBA68E30DD697E45B4780DC943B895FD821844A781EACCC44DA8622CCD4CD94733462F9267A1171B4FBB8494DD,
    0x6152BF1F14C2797A4A7C6E07E8F151FBAE1EFA450D2972CCE1D794A35E4CA58AE9DE455265EFC66183CACCA2B3560E2D518CA40F7BE3D5FBDF8864AF151A657D4630AC9FE624826CFABE4A77671457769CE8A821C60F5A43DBF268665EF8100B34FC1DFC1298A3ADD43F46E88B8B3DA8815D7EAED8815F0A3B93E6616CCCAA76,
    'admin',
    1,
    GETDATE()
)

PRINT 'Usuario admin creado correctamente.'
PRINT 'Credenciales: admin / admin'

GO