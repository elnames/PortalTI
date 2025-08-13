using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPazYSalvoTableOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PazYSalvos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    UsuarioNombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArchivoPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pendiente"),
                    ActivosPendientes = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Notas = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false, defaultValue: ""),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PazYSalvos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PazYSalvos_NominaUsuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "NominaUsuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_Estado",
                table: "PazYSalvos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_FechaSubida",
                table: "PazYSalvos",
                column: "FechaSubida");

            migrationBuilder.CreateIndex(
                name: "IX_PazYSalvos_UsuarioId",
                table: "PazYSalvos",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PazYSalvos");
        }
    }
}
