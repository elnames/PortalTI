using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPazYSalvoTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Comentado: No eliminar tablas existentes
            // migrationBuilder.DropTable(
            //     name: "CalendarEventAssignees");

            // migrationBuilder.DropTable(
            //     name: "ChatArchivos");

            // migrationBuilder.DropTable(
            //     name: "ChatMensajes");

            // migrationBuilder.DropTable(
            //     name: "CalendarEvents");

            // migrationBuilder.DropTable(
            //     name: "ChatConversaciones");

            // Comentado: No modificar tabla PazYSalvos existente
            // migrationBuilder.DropIndex(
            //     name: "IX_PazYSalvos_FechaSubida",
            //     table: "PazYSalvos");

            // migrationBuilder.DropColumn(
            //     name: "ArchivoPath",
            //     table: "PazYSalvos");

            // migrationBuilder.RenameColumn(
            //     name: "Notas",
            //     table: "PazYSalvos",
            //     newName: "Observaciones");

            // migrationBuilder.RenameColumn(
            //     name: "FechaSubida",
            //     table: "PazYSalvos",
            //     newName: "FechaSalida");

            // migrationBuilder.RenameColumn(
            //     name: "ActivosPendientes",
            //     table: "PazYSalvos",
            //     newName: "SolicitadoPorId");

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
                name: "HashFinal",
                table: "PazYSalvos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoSalida",
                table: "PazYSalvos",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PdfFinalPath",
                table: "PazYSalvos",
                type: "nvarchar(max)",
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

            migrationBuilder.CreateTable(
                name: "PazYSalvoActivoSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PazYSalvoId = table.Column<int>(type: "int", nullable: false),
                    ActivoId = table.Column<int>(type: "int", nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EstadoActivo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Observacion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaCorte = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoActivoSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvoActivoSnapshots_Activos_ActivoId",
                        column: x => x.ActivoId,
                        principalTable: "Activos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PazYSalvoActivoSnapshots_PazYSalvos_PazYSalvoId",
                        column: x => x.PazYSalvoId,
                        principalTable: "PazYSalvos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PazYSalvoAdjuntos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PazYSalvoId = table.Column<int>(type: "int", nullable: false),
                    SubidoPorId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Ruta = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tamaño = table.Column<long>(type: "bigint", nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoAdjuntos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvoAdjuntos_AuthUsers_SubidoPorId",
                        column: x => x.SubidoPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PazYSalvoAdjuntos_PazYSalvos_PazYSalvoId",
                        column: x => x.PazYSalvoId,
                        principalTable: "PazYSalvos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PazYSalvoConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    RequiereCierreSinActivos = table.Column<bool>(type: "bit", nullable: false),
                    PermiteDelegacion = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PazYSalvoExcepciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PazYSalvoId = table.Column<int>(type: "int", nullable: false),
                    AprobadaPorId = table.Column<int>(type: "int", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoExcepciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvoExcepciones_AuthUsers_AprobadaPorId",
                        column: x => x.AprobadaPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PazYSalvoExcepciones_PazYSalvos_PazYSalvoId",
                        column: x => x.PazYSalvoId,
                        principalTable: "PazYSalvos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PazYSalvoFirmas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PazYSalvoId = table.Column<int>(type: "int", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Obligatorio = table.Column<bool>(type: "bit", nullable: false),
                    FirmanteUserId = table.Column<int>(type: "int", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FirmaHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SelloTiempo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Comentario = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoFirmas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvoFirmas_AuthUsers_FirmanteUserId",
                        column: x => x.FirmanteUserId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PazYSalvoFirmas_PazYSalvos_PazYSalvoId",
                        column: x => x.PazYSalvoId,
                        principalTable: "PazYSalvos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PazYSalvoHistorial",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PazYSalvoId = table.Column<int>(type: "int", nullable: false),
                    ActorUserId = table.Column<int>(type: "int", nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EstadoDesde = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EstadoHasta = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Nota = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FechaAccion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoHistorial", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvoHistorial_AuthUsers_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PazYSalvoHistorial_PazYSalvos_PazYSalvoId",
                        column: x => x.PazYSalvoId,
                        principalTable: "PazYSalvos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PazYSalvoConfigFirmas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConfigId = table.Column<int>(type: "int", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Obligatorio = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvoConfigFirmas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvoConfigFirmas_PazYSalvoConfigs_ConfigId",
                        column: x => x.ConfigId,
                        principalTable: "PazYSalvoConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_FechaCreacion",
                table: "PazYSalvos",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_SolicitadoPorId",
                table: "PazYSalvos",
                column: "SolicitadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoActivoSnapshots_ActivoId",
                table: "PazYSalvoActivoSnapshots",
                column: "ActivoId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoActivoSnapshots_PazYSalvoId",
                table: "PazYSalvoActivoSnapshots",
                column: "PazYSalvoId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoAdjuntos_PazYSalvoId",
                table: "PazYSalvoAdjuntos",
                column: "PazYSalvoId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoAdjuntos_SubidoPorId",
                table: "PazYSalvoAdjuntos",
                column: "SubidoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoConfigFirmas_ConfigId",
                table: "PazYSalvoConfigFirmas",
                column: "ConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoExcepciones_AprobadaPorId",
                table: "PazYSalvoExcepciones",
                column: "AprobadaPorId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoExcepciones_PazYSalvoId",
                table: "PazYSalvoExcepciones",
                column: "PazYSalvoId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoFirmas_Estado",
                table: "PazYSalvoFirmas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoFirmas_FirmanteUserId",
                table: "PazYSalvoFirmas",
                column: "FirmanteUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoFirmas_PazYSalvoId_Rol",
                table: "PazYSalvoFirmas",
                columns: new[] { "PazYSalvoId", "Rol" });

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoHistorial_ActorUserId",
                table: "PazYSalvoHistorial",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvoHistorial_PazYSalvoId_FechaAccion",
                table: "PazYSalvoHistorial",
                columns: new[] { "PazYSalvoId", "FechaAccion" });

            migrationBuilder.AddForeignKey(
                name: "FK_PazYSalvos_AuthUsers_SolicitadoPorId",
                table: "PazYSalvos",
                column: "SolicitadoPorId",
                principalTable: "AuthUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PazYSalvos_AuthUsers_SolicitadoPorId",
                table: "PazYSalvos");

            migrationBuilder.DropTable(
                name: "PazYSalvoActivoSnapshots");

            migrationBuilder.DropTable(
                name: "PazYSalvoAdjuntos");

            migrationBuilder.DropTable(
                name: "PazYSalvoConfigFirmas");

            migrationBuilder.DropTable(
                name: "PazYSalvoExcepciones");

            migrationBuilder.DropTable(
                name: "PazYSalvoFirmas");

            migrationBuilder.DropTable(
                name: "PazYSalvoHistorial");

            migrationBuilder.DropTable(
                name: "PazYSalvoConfigs");

            migrationBuilder.DropIndex(
                name: "IX_PazYSalvos_FechaCreacion",
                table: "PazYSalvos");

            migrationBuilder.DropIndex(
                name: "IX_PazYSalvos_SolicitadoPorId",
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
                name: "HashFinal",
                table: "PazYSalvos");

            migrationBuilder.DropColumn(
                name: "MotivoSalida",
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
                name: "Observaciones",
                table: "PazYSalvos",
                newName: "Notas");

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
        }
    }
}
