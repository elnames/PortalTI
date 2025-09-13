using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActasTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Actas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AsignacionId = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MetodoFirma = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RutaArchivo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFirma = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaAprobacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AprobadoPorId = table.Column<int>(type: "int", nullable: true),
                    ComentariosAprobacion = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Actas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Actas_AsignacionesActivos_AsignacionId",
                        column: x => x.AsignacionId,
                        principalTable: "AsignacionesActivos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Actas_AuthUsers_AprobadoPorId",
                        column: x => x.AprobadoPorId,
                        principalTable: "AuthUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Actas_AprobadoPorId",
                table: "Actas",
                column: "AprobadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Actas_AsignacionId",
                table: "Actas",
                column: "AsignacionId");

            migrationBuilder.CreateIndex(
                name: "IX_Actas_Estado",
                table: "Actas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Actas_FechaCreacion",
                table: "Actas",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_Actas_MetodoFirma",
                table: "Actas",
                column: "MetodoFirma");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Actas");
        }
    }
}
