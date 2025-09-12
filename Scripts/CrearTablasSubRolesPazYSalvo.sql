-- Script para crear las tablas de subroles de Paz y Salvo
-- Este script mantiene los roles principales y agrega subroles específicos

-- 1. Crear tabla PazYSalvoSubRoles
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PazYSalvoSubRoles')
BEGIN
    CREATE TABLE PazYSalvoSubRoles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255),
        CanGeneratePazYSalvo BIT NOT NULL DEFAULT 0,
        CanApprovePazYSalvo BIT NOT NULL DEFAULT 0,
        CanRejectPazYSalvo BIT NOT NULL DEFAULT 0,
        CanDelegate BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
    
    PRINT 'Tabla PazYSalvoSubRoles creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla PazYSalvoSubRoles ya existe';
END

-- 2. Crear tabla PazYSalvoDelegations
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PazYSalvoDelegations')
BEGIN
    CREATE TABLE PazYSalvoDelegations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DelegatorUserId INT NOT NULL,
        DelegatedToUserId INT NOT NULL,
        SubRole NVARCHAR(50) NOT NULL,
        Reason NVARCHAR(1000) NOT NULL,
        StartDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        EndDate DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        
        -- Foreign Keys
        FOREIGN KEY (DelegatorUserId) REFERENCES AuthUsers(Id),
        FOREIGN KEY (DelegatedToUserId) REFERENCES AuthUsers(Id)
    );
    
    PRINT 'Tabla PazYSalvoDelegations creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla PazYSalvoDelegations ya existe';
END

-- 3. Insertar subroles predefinidos
IF NOT EXISTS (SELECT * FROM PazYSalvoSubRoles WHERE Name = 'RRHH')
BEGIN
    INSERT INTO PazYSalvoSubRoles (Name, Description, CanGeneratePazYSalvo, CanApprovePazYSalvo, CanRejectPazYSalvo, CanDelegate)
    VALUES ('RRHH', 'Recursos Humanos - Puede generar y gestionar Paz y Salvo', 1, 1, 1, 1);
    PRINT 'Subrol RRHH insertado';
END

IF NOT EXISTS (SELECT * FROM PazYSalvoSubRoles WHERE Name = 'Jefatura Directa')
BEGIN
    INSERT INTO PazYSalvoSubRoles (Name, Description, CanGeneratePazYSalvo, CanApprovePazYSalvo, CanRejectPazYSalvo, CanDelegate)
    VALUES ('Jefatura Directa', 'Jefatura Directa - Puede aprobar Paz y Salvo de su equipo', 0, 1, 1, 1);
    PRINT 'Subrol Jefatura Directa insertado';
END

IF NOT EXISTS (SELECT * FROM PazYSalvoSubRoles WHERE Name = 'TI')
BEGIN
    INSERT INTO PazYSalvoSubRoles (Name, Description, CanGeneratePazYSalvo, CanApprovePazYSalvo, CanRejectPazYSalvo, CanDelegate)
    VALUES ('TI', 'Tecnología de la Información - Puede revisar aspectos técnicos', 0, 1, 1, 1);
    PRINT 'Subrol TI insertado';
END

IF NOT EXISTS (SELECT * FROM PazYSalvoSubRoles WHERE Name = 'Contabilidad')
BEGIN
    INSERT INTO PazYSalvoSubRoles (Name, Description, CanGeneratePazYSalvo, CanApprovePazYSalvo, CanRejectPazYSalvo, CanDelegate)
    VALUES ('Contabilidad', 'Contabilidad - Puede revisar aspectos financieros', 0, 1, 1, 1);
    PRINT 'Subrol Contabilidad insertado';
END

IF NOT EXISTS (SELECT * FROM PazYSalvoSubRoles WHERE Name = 'Gerencia de Finanzas')
BEGIN
    INSERT INTO PazYSalvoSubRoles (Name, Description, CanGeneratePazYSalvo, CanApprovePazYSalvo, CanRejectPazYSalvo, CanDelegate)
    VALUES ('Gerencia de Finanzas', 'Gerencia de Finanzas - Puede revisar aspectos financieros', 0, 1, 1, 1);
    PRINT 'Subrol Gerencia de Finanzas insertado';
END

-- 4. Crear índices para mejor rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PazYSalvoSubRoles_Name' AND object_id = OBJECT_ID('PazYSalvoSubRoles'))
BEGIN
    CREATE INDEX IX_PazYSalvoSubRoles_Name ON PazYSalvoSubRoles(Name);
    PRINT 'Índice IX_PazYSalvoSubRoles_Name creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PazYSalvoDelegations_DelegatorUserId' AND object_id = OBJECT_ID('PazYSalvoDelegations'))
BEGIN
    CREATE INDEX IX_PazYSalvoDelegations_DelegatorUserId ON PazYSalvoDelegations(DelegatorUserId);
    PRINT 'Índice IX_PazYSalvoDelegations_DelegatorUserId creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PazYSalvoDelegations_DelegatedToUserId' AND object_id = OBJECT_ID('PazYSalvoDelegations'))
BEGIN
    CREATE INDEX IX_PazYSalvoDelegations_DelegatedToUserId ON PazYSalvoDelegations(DelegatedToUserId);
    PRINT 'Índice IX_PazYSalvoDelegations_DelegatedToUserId creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PazYSalvoDelegations_SubRole' AND object_id = OBJECT_ID('PazYSalvoDelegations'))
BEGIN
    CREATE INDEX IX_PazYSalvoDelegations_SubRole ON PazYSalvoDelegations(SubRole);
    PRINT 'Índice IX_PazYSalvoDelegations_SubRole creado';
END

PRINT 'Script de subroles de Paz y Salvo ejecutado exitosamente';
