using Microsoft.EntityFrameworkCore;

namespace PortalTi.Api.Data
{
	public static class SchemaFixer
	{
		/// <summary>
		/// Asegura que la tabla Notificaciones tenga las columnas e índices esperados.
		/// No reemplaza migraciones: es un salvavidas para entornos que quedaron desfasados.
		/// </summary>
		public static void EnsureNotificationsSchema(PortalTiContext context)
		{
			var sql = @"
-- Alinear nombre de columna a 'UserId' (si solo existe 'UsuarioId')
IF COL_LENGTH('dbo.Notificaciones', 'UserId') IS NULL AND COL_LENGTH('dbo.Notificaciones', 'UsuarioId') IS NOT NULL
    EXEC('EXEC sp_rename ''dbo.Notificaciones.UsuarioId'', ''UserId'', ''COLUMN''');

-- Si coexisten ambas columnas, asegurar que 'UsuarioId' no bloquee inserts
IF COL_LENGTH('dbo.Notificaciones', 'UserId') IS NOT NULL AND COL_LENGTH('dbo.Notificaciones', 'UsuarioId') IS NOT NULL
BEGIN
    DECLARE @isNullable BIT = (SELECT is_nullable FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Notificaciones') AND name = 'UsuarioId');
    IF (@isNullable = 0)
        ALTER TABLE dbo.Notificaciones ALTER COLUMN UsuarioId INT NULL;
    UPDATE n SET UsuarioId = ISNULL(UsuarioId, UserId) FROM dbo.Notificaciones n;
END
IF COL_LENGTH('dbo.Notificaciones', 'UserId') IS NULL
    ALTER TABLE dbo.Notificaciones ADD UserId INT NOT NULL CONSTRAINT DF_Notif_UserId DEFAULT(0);
IF COL_LENGTH('dbo.Notificaciones', 'Titulo') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Titulo NVARCHAR(150) NOT NULL CONSTRAINT DF_Notif_Titulo DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones', 'Mensaje') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Mensaje NVARCHAR(500) NOT NULL CONSTRAINT DF_Notif_Mensaje DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones', 'RefTipo') IS NULL
    ALTER TABLE dbo.Notificaciones ADD RefTipo NVARCHAR(40) NULL;
IF COL_LENGTH('dbo.Notificaciones', 'RefId') IS NULL
    ALTER TABLE dbo.Notificaciones ADD RefId INT NULL;
IF COL_LENGTH('dbo.Notificaciones', 'Ruta') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Ruta NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.Notificaciones', 'IsRead') IS NULL
    ALTER TABLE dbo.Notificaciones ADD IsRead BIT NOT NULL CONSTRAINT DF_Notif_IsRead DEFAULT(0);
IF COL_LENGTH('dbo.Notificaciones', 'CreatedAt') IS NULL
    ALTER TABLE dbo.Notificaciones ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notif_CreatedAt DEFAULT (SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notif_User_IsRead_CreatedAt' AND object_id = OBJECT_ID('dbo.Notificaciones'))
    CREATE INDEX IX_Notif_User_IsRead_CreatedAt ON dbo.Notificaciones(UserId, IsRead, CreatedAt DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notif_RefTipo_RefId' AND object_id = OBJECT_ID('dbo.Notificaciones'))
    CREATE INDEX IX_Notif_RefTipo_RefId ON dbo.Notificaciones(RefTipo, RefId);
";

			try
			{
				context.Database.ExecuteSqlRaw(sql);
			}
			catch
			{
				// No interrumpir el arranque; si falla, el log de middleware mostrará el 500 y se podrá corregir manualmente
			}
		}
	}
}


