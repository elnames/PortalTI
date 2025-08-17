using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacyNotifColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
BEGIN TRAN;

-- Eliminar columnas legadas si existen
IF COL_LENGTH('dbo.Notificaciones','Leida') IS NOT NULL
    ALTER TABLE dbo.Notificaciones DROP COLUMN Leida;
IF COL_LENGTH('dbo.Notificaciones','Fecha') IS NOT NULL
    ALTER TABLE dbo.Notificaciones DROP COLUMN Fecha;
IF COL_LENGTH('dbo.Notificaciones','Datos') IS NOT NULL
    ALTER TABLE dbo.Notificaciones DROP COLUMN Datos;

-- Asegurar defaults y no-nulos
IF COL_LENGTH('dbo.Notificaciones','IsRead') IS NULL
    ALTER TABLE dbo.Notificaciones ADD IsRead BIT NOT NULL CONSTRAINT DF_Notif_IsRead DEFAULT(0);
IF COL_LENGTH('dbo.Notificaciones','CreatedAt') IS NULL
    ALTER TABLE dbo.Notificaciones ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notif_CreatedAt DEFAULT(SYSUTCDATETIME());
IF COL_LENGTH('dbo.Notificaciones','Titulo') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Titulo NVARCHAR(150) NOT NULL CONSTRAINT DF_Notif_Titulo DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones','Mensaje') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Mensaje NVARCHAR(500) NOT NULL CONSTRAINT DF_Notif_Mensaje DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones','Tipo') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Tipo NVARCHAR(40) NOT NULL CONSTRAINT DF_Notif_Tipo DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones','UserId') IS NULL
    ALTER TABLE dbo.Notificaciones ADD UserId INT NOT NULL CONSTRAINT DF_Notif_UserId DEFAULT(0);

-- Índices (idempotentes)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Notif_User_IsRead_CreatedAt' AND object_id=OBJECT_ID('dbo.Notificaciones'))
    CREATE INDEX IX_Notif_User_IsRead_CreatedAt ON dbo.Notificaciones(UserId, IsRead, CreatedAt DESC);

COMMIT;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No revertimos columnas legadas
        }
    }
}
