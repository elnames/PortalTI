-- Script para crear la tabla de notificaciones
-- Ejecutar en SQL Server

CREATE TABLE Notificacion (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  UserId INT NOT NULL,
  Tipo VARCHAR(40) NOT NULL,
  Titulo NVARCHAR(150) NOT NULL,
  Mensaje NVARCHAR(500) NOT NULL,
  RefTipo VARCHAR(40) NULL,
  RefId INT NULL,
  Ruta NVARCHAR(200) NULL,
  IsRead BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Índice para optimizar consultas por usuario y estado de lectura
CREATE INDEX IX_Notificacion_User_Read ON Notificacion(UserId, IsRead, CreatedAt DESC);

-- Índice para consultas por tipo de referencia
CREATE INDEX IX_Notificacion_RefType_RefId ON Notificacion(RefTipo, RefId);

-- Índice para consultas por fecha de creación
CREATE INDEX IX_Notificacion_CreatedAt ON Notificacion(CreatedAt DESC);

-- Comentarios sobre la tabla
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tabla para almacenar notificaciones del sistema', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'ID del usuario que recibe la notificación', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'UserId';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tipo de notificación (ticket, asset, user, system, etc.)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'Tipo';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Título de la notificación', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'Titulo';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Mensaje detallado de la notificación', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'Mensaje';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tipo de referencia (Ticket, Activo, Usuario, etc.)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'RefTipo';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'ID de la entidad referenciada', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'RefId';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Ruta interna para navegar al hacer clic en la notificación', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'Ruta';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Indica si la notificación ha sido leída', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'IsRead';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Fecha y hora de creación de la notificación', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Notificacion', 
    @level2type = N'COLUMN', @level2name = N'CreatedAt';
