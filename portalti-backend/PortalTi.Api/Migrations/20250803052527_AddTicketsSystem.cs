using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NombreSolicitante = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EmailSolicitante = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TelefonoSolicitante = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Empresa = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Departamento = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Categoria = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Prioridad = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaResolucion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCierre = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AsignadoAId = table.Column<int>(type: "int", nullable: true),
                    CreadoPorId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_AuthUsers_AsignadoAId",
                        column: x => x.AsignadoAId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tickets_AuthUsers_CreadoPorId",
                        column: x => x.CreadoPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ArchivosTickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreOriginal = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    RutaArchivo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TamañoBytes = table.Column<long>(type: "bigint", nullable: false),
                    TipoMime = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    SubidoPorId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArchivosTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArchivosTickets_AuthUsers_SubidoPorId",
                        column: x => x.SubidoPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ArchivosTickets_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ComentariosTickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EsInterno = table.Column<bool>(type: "bit", nullable: false),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    CreadoPorId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComentariosTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComentariosTickets_AuthUsers_CreadoPorId",
                        column: x => x.CreadoPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ComentariosTickets_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArchivosTickets_SubidoPorId",
                table: "ArchivosTickets",
                column: "SubidoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_ArchivosTickets_TicketId_FechaSubida",
                table: "ArchivosTickets",
                columns: new[] { "TicketId", "FechaSubida" });

            migrationBuilder.CreateIndex(
                name: "IX_ComentariosTickets_CreadoPorId",
                table: "ComentariosTickets",
                column: "CreadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_ComentariosTickets_TicketId_FechaCreacion",
                table: "ComentariosTickets",
                columns: new[] { "TicketId", "FechaCreacion" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AsignadoAId",
                table: "Tickets",
                column: "AsignadoAId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Categoria",
                table: "Tickets",
                column: "Categoria");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreadoPorId",
                table: "Tickets",
                column: "CreadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Estado",
                table: "Tickets",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_FechaCreacion",
                table: "Tickets",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Prioridad",
                table: "Tickets",
                column: "Prioridad");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArchivosTickets");

            migrationBuilder.DropTable(
                name: "ComentariosTickets");

            migrationBuilder.DropTable(
                name: "Tickets");
        }
    }
}
