-- Crear tabla Software
CREATE TABLE Software (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Version NVARCHAR(50) NULL,
    Estado NVARCHAR(20) NOT NULL DEFAULT 'OK',
    FechaInstalacion DATE NULL,
    Notas NVARCHAR(500) NULL,
    ActivoId INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 NULL,
    CreadoPor NVARCHAR(100) NULL,
    ActualizadoPor NVARCHAR(100) NULL,
    CONSTRAINT FK_Software_Activo FOREIGN KEY (ActivoId) REFERENCES Activos(Id) ON DELETE CASCADE
);

-- Crear tabla ProgramasSeguridad
CREATE TABLE ProgramasSeguridad (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Tipo NVARCHAR(50) NOT NULL DEFAULT 'Antivirus',
    Estado NVARCHAR(20) NOT NULL DEFAULT 'OK',
    Notas NVARCHAR(500) NULL,
    ActivoId INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 NULL,
    CreadoPor NVARCHAR(100) NULL,
    ActualizadoPor NVARCHAR(100) NULL,
    CONSTRAINT FK_ProgramasSeguridad_Activo FOREIGN KEY (ActivoId) REFERENCES Activos(Id) ON DELETE CASCADE
);

-- Crear tabla Licencias
CREATE TABLE Licencias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Software NVARCHAR(100) NOT NULL,
    Tipo NVARCHAR(50) NOT NULL DEFAULT 'Perpetua',
    NumeroLicencia NVARCHAR(100) NULL,
    UsuarioAsignado NVARCHAR(100) NULL,
    FechaInicio DATE NULL,
    FechaVencimiento DATE NULL,
    Notas NVARCHAR(500) NULL,
    ActivoId INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FechaActualizacion DATETIME2 NULL,
    CreadoPor NVARCHAR(100) NULL,
    ActualizadoPor NVARCHAR(100) NULL,
    CONSTRAINT FK_Licencias_Activo FOREIGN KEY (ActivoId) REFERENCES Activos(Id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IX_Software_ActivoId ON Software(ActivoId);
CREATE INDEX IX_Software_FechaCreacion ON Software(FechaCreacion);
CREATE INDEX IX_ProgramasSeguridad_ActivoId ON ProgramasSeguridad(ActivoId);
CREATE INDEX IX_ProgramasSeguridad_FechaCreacion ON ProgramasSeguridad(FechaCreacion);
CREATE INDEX IX_Licencias_ActivoId ON Licencias(ActivoId);
CREATE INDEX IX_Licencias_FechaCreacion ON Licencias(FechaCreacion);
