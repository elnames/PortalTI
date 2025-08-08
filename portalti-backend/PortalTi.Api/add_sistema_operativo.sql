-- Script para agregar la columna SistemaOperativo a la tabla Activos
-- Ejecutar este script en SQL Server Management Studio

USE PortalTi;
GO

-- Verificar si la columna ya existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Activos' AND COLUMN_NAME = 'SistemaOperativo')
BEGIN
    -- Agregar la columna SistemaOperativo
    ALTER TABLE Activos ADD SistemaOperativo nvarchar(max) NULL;
    PRINT 'Columna SistemaOperativo agregada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La columna SistemaOperativo ya existe.';
END
GO 