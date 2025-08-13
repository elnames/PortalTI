-- Crear tabla ChatArchivos para archivo personalizado por usuario
CREATE TABLE ChatArchivos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL,
    ConversacionId INT NOT NULL,
    FechaArchivo DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    -- Claves foráneas
    CONSTRAINT FK_ChatArchivos_Usuario FOREIGN KEY (UsuarioId) REFERENCES AuthUsers(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_ChatArchivos_Conversacion FOREIGN KEY (ConversacionId) REFERENCES ChatConversaciones(Id) ON DELETE NO ACTION,
    
    -- Índices para mejorar rendimiento
    CONSTRAINT UQ_ChatArchivos_Usuario_Conversacion UNIQUE (UsuarioId, ConversacionId)
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IX_ChatArchivos_UsuarioId ON ChatArchivos(UsuarioId);
CREATE INDEX IX_ChatArchivos_ConversacionId ON ChatArchivos(ConversacionId);
CREATE INDEX IX_ChatArchivos_FechaArchivo ON ChatArchivos(FechaArchivo);
