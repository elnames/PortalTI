using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatConversaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    SoporteId = table.Column<int>(type: "int", nullable: true),
                    TicketId = table.Column<int>(type: "int", nullable: true)
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
                name: "ChatMensajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EsInterno = table.Column<bool>(type: "bit", nullable: false),
                    EsLeido = table.Column<bool>(type: "bit", nullable: false),
                    FechaLectura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConversacionId = table.Column<int>(type: "int", nullable: false),
                    CreadoPorId = table.Column<int>(type: "int", nullable: true)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatMensajes");

            migrationBuilder.DropTable(
                name: "ChatConversaciones");
        }
    }
}
