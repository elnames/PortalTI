using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixPazYSalvoOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PazYSalvos_NominaUsuarios_UsuarioId",
                table: "PazYSalvos");

            // Eliminar tablas del calendario si existen
            migrationBuilder.Sql(@"
                IF OBJECT_ID('dbo.CalendarEventAssignees', 'U') IS NOT NULL
                    DROP TABLE [CalendarEventAssignees];
                IF OBJECT_ID('dbo.ChatArchivos', 'U') IS NOT NULL
                    DROP TABLE [ChatArchivos];
                IF OBJECT_ID('dbo.ChatMensajes', 'U') IS NOT NULL
                    DROP TABLE [ChatMensajes];
                IF OBJECT_ID('dbo.CalendarEvents', 'U') IS NOT NULL
                    DROP TABLE [CalendarEvents];
                IF OBJECT_ID('dbo.ChatConversaciones', 'U') IS NOT NULL
                    DROP TABLE [ChatConversaciones];
            ");

            // Eliminar índice si existe
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PazYSalvos_FechaSubida' AND object_id = OBJECT_ID('PazYSalvos'))
                    DROP INDEX [IX_PazYSalvos_FechaSubida] ON [PazYSalvos];
            ");

            // Eliminar columnas si existen
            migrationBuilder.Sql(@"
                IF COL_LENGTH('PazYSalvos', 'ArchivoPath') IS NOT NULL
                    ALTER TABLE [PazYSalvos] DROP COLUMN [ArchivoPath];
                IF COL_LENGTH('PazYSalvos', 'Notas') IS NOT NULL
                    ALTER TABLE [PazYSalvos] DROP COLUMN [Notas];
            ");

            // Las columnas ya existen, no necesitamos renombrarlas

            migrationBuilder.AddColumn<string>(
                name: "ActivosSnapshotJson",
                table: "PazYSalvos",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdjuntosJson",
                table: "PazYSalvos",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExcepcionesJson",
                table: "PazYSalvos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAprobacion",
                table: "PazYSalvos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCierre",
                table: "PazYSalvos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEnvioFirma",
                table: "PazYSalvos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmasJson",
                table: "PazYSalvos",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HashFinal",
                table: "PazYSalvos",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HistorialJson",
                table: "PazYSalvos",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoSalida",
                table: "PazYSalvos",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "PazYSalvos",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PdfFinalPath",
                table: "PazYSalvos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "PazYSalvos",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "UsuarioRut",
                table: "PazYSalvos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_FechaCreacion",
                table: "PazYSalvos",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_SolicitadoPorId",
                table: "PazYSalvos",
                column: "SolicitadoPorId");

            migrationBuilder.AddForeignKey(
                name: "FK_PazYSalvos_AuthUsers_SolicitadoPorId",
                table: "PazYSalvos",
                column: "SolicitadoPorId",
                principalTable: "AuthUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PazYSalvos_NominaUsuarios_UsuarioId",
                table: "PazYSalvos",
                column: "UsuarioId",
                principalTable: "NominaUsuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PazYSalvos_AuthUsers_SolicitadoPorId",
                table: "PazYSalvos");

            migrationBuilder.DropForeignKey(
                name: "FK_PazYSalvos_NominaUsuarios_UsuarioId",
                table: "PazYSalvos");

            migrationBuilder.DropIndex(
                name: "IX_PazYSalvos_FechaCreacion",
                table: "PazYSalvos");

            migrationBuilder.DropIndex(
                name: "IX_PazYSalvos_SolicitadoPorId",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "ActivosSnapshotJson",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "AdjuntosJson",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "ExcepcionesJson",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "FechaAprobacion",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "FechaCierre",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "FechaEnvioFirma",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "FirmasJson",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "HashFinal",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "HistorialJson",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "MotivoSalida",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "Observaciones",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "PdfFinalPath",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "UsuarioRut",
                table: "PazYSalvos");

            migrationBuilder.RenameColumn(
                name: "SolicitadoPorId",
                table: "PazYSalvos",
                newName: "ActivosPendientes");

            migrationBuilder.RenameColumn(
                name: "FechaSalida",
                table: "PazYSalvos",
                newName: "FechaSubida");

            migrationBuilder.AddColumn<string>(
                name: "ArchivoPath",
                table: "PazYSalvos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "PazYSalvos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CalendarEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedById = table.Column<int>(type: "int", nullable: false),
                    AllDay = table.Column<bool>(type: "bit", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    End = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_AuthUsers_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatConversaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SoporteId = table.Column<int>(type: "int", nullable: true),
                    TicketId = table.Column<int>(type: "int", nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatConversaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatConversaciones_AuthUsers_SoporteId",
                        column: x => x.SoporteId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatConversaciones_AuthUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatConversaciones_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CalendarEventAssignees",
                columns: table => new
                {
                    EventId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEventAssignees", x => new { x.EventId, x.UserId });
                    table.ForeignKey(
                        name: "FK_CalendarEventAssignees_AuthUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CalendarEventAssignees_CalendarEvents_EventId",
                        column: x => x.EventId,
                        principalTable: "CalendarEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatArchivos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversacionId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    FechaArchivo = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatArchivos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatArchivos_AuthUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatArchivos_ChatConversaciones_ConversacionId",
                        column: x => x.ConversacionId,
                        principalTable: "ChatConversaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatMensajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversacionId = table.Column<int>(type: "int", nullable: false),
                    CreadoPorId = table.Column<int>(type: "int", nullable: true),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EsInterno = table.Column<bool>(type: "bit", nullable: false),
                    EsLeido = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaLectura = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMensajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMensajes_AuthUsers_CreadoPorId",
                        column: x => x.CreadoPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatMensajes_ChatConversaciones_ConversacionId",
                        column: x => x.ConversacionId,
                        principalTable: "ChatConversaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_FechaSubida",
                table: "PazYSalvos",
                column: "FechaSubida");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventAssignees_UserId",
                table: "CalendarEventAssignees",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_CreatedAt",
                table: "CalendarEvents",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_CreatedById",
                table: "CalendarEvents",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_Start",
                table: "CalendarEvents",
                column: "Start");

            migrationBuilder.CreateIndex(
                name: "IX_ChatArchivos_ConversacionId",
                table: "ChatArchivos",
                column: "ConversacionId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatArchivos_UsuarioId",
                table: "ChatArchivos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversaciones_Estado",
                table: "ChatConversaciones",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversaciones_FechaCreacion",
                table: "ChatConversaciones",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversaciones_SoporteId",
                table: "ChatConversaciones",
                column: "SoporteId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversaciones_TicketId",
                table: "ChatConversaciones",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversaciones_UsuarioId",
                table: "ChatConversaciones",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_ConversacionId_FechaCreacion",
                table: "ChatMensajes",
                columns: new[] { "ConversacionId", "FechaCreacion" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_CreadoPorId",
                table: "ChatMensajes",
                column: "CreadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_EsLeido",
                table: "ChatMensajes",
                column: "EsLeido");

            migrationBuilder.AddForeignKey(
                name: "FK_PazYSalvos_NominaUsuarios_UsuarioId",
                table: "PazYSalvos",
                column: "UsuarioId",
                principalTable: "NominaUsuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
