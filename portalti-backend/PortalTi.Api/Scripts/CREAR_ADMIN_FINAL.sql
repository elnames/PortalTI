-- =====================================================
-- SCRIPT PARA CREAR USUARIO ADMIN CON HASH CORRECTO
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

-- Crear usuario admin con hash correcto para contraseña "admin"
INSERT INTO [AuthUsers] ([Username], [PasswordHash], [PasswordSalt], [Role], [IsActive], [CreatedAt])
VALUES (
    'admin',
    0x0D4F2EA095219A9003103E8404582A797DAF6C21D2EDE332CA9EDD871269537C4BE8E0B1673AE3747C0CF0C3F602C89DB883CD6E11F36A49FAB401178441E463,
    0x46C5879030C00C49D8DD626B05A3F8E74E34BCA7F6722A07FADB4EBCAD24BEB713A7ECC7A9323755605CF22A91C61684914EF199867BCCE63244F471CA4B89A4DCB9F2C2AE219F375B962BB287A237D32C3D4B99368578CC37B06888403F2953F23F4ACD409B07D21F5E191471E4BE79B02C3EE6D3D94797F5DA7EA5ACB27E49,
    'admin',
    1,
    GETDATE()
)

PRINT 'Usuario admin creado correctamente.'
PRINT 'Credenciales: admin / admin'

-- Verificar que el usuario se creó correctamente
SELECT 
    Id,
    Username,
    Role,
    IsActive,
    CreatedAt,
    LEN(PasswordHash) as HashLength,
    LEN(PasswordSalt) as SaltLength
FROM AuthUsers 
WHERE Username = 'admin'

GO
