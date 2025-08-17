using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixNotificacionesUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Normalizar definitivamente a UserId
            migrationBuilder.Sql(@"
BEGIN TRAN;

-- Si solo existe UsuarioId: renombrar a UserId
IF COL_LENGTH('dbo.Notificaciones','UserId') IS NULL 
   AND COL_LENGTH('dbo.Notificaciones','UsuarioId') IS NOT NULL
    EXEC('EXEC sp_rename ''dbo.Notificaciones.UsuarioId'',''UserId'',''COLUMN''');

-- Si existen ambas: copiar datos y eliminar UsuarioId
IF COL_LENGTH('dbo.Notificaciones','UserId') IS NOT NULL 
   AND COL_LENGTH('dbo.Notificaciones','UsuarioId') IS NOT NULL
BEGIN
    EXEC('UPDATE n SET n.UserId = ISNULL(n.UserId, n.UsuarioId) FROM dbo.Notificaciones n;');
    EXEC('ALTER TABLE dbo.Notificaciones ALTER COLUMN UserId INT NOT NULL;');
    EXEC('ALTER TABLE dbo.Notificaciones DROP COLUMN UsuarioId;');
END

-- Garantizar columnas e índice mínimos
IF COL_LENGTH('dbo.Notificaciones','Titulo') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Titulo NVARCHAR(150) NOT NULL CONSTRAINT DF_Notif_Titulo DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones','Mensaje') IS NULL
    ALTER TABLE dbo.Notificaciones ADD Mensaje NVARCHAR(500) NOT NULL CONSTRAINT DF_Notif_Mensaje DEFAULT('');
IF COL_LENGTH('dbo.Notificaciones','IsRead') IS NULL
    ALTER TABLE dbo.Notificaciones ADD IsRead BIT NOT NULL CONSTRAINT DF_Notif_IsRead DEFAULT(0);
IF COL_LENGTH('dbo.Notificaciones','CreatedAt') IS NULL
    ALTER TABLE dbo.Notificaciones ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notif_CreatedAt DEFAULT(SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Notif_User_IsRead_CreatedAt' AND object_id=OBJECT_ID('dbo.Notificaciones'))
    CREATE INDEX IX_Notif_User_IsRead_CreatedAt ON dbo.Notificaciones(UserId, IsRead, CreatedAt DESC);

COMMIT;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No revertimos el rename/drop para evitar volver a un esquema inconsistente
        }
    }
}
