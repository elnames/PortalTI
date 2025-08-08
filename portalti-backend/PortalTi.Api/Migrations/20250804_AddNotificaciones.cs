using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace PortalTi.Api.Migrations
{
    public partial class AddNotificaciones : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(nullable: false),
                    Tipo = table.Column<string>(nullable: false),
                    Mensaje = table.Column<string>(nullable: false),
                    Datos = table.Column<string>(nullable: true),
                    Leida = table.Column<bool>(nullable: false),
                    Fecha = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Notificaciones");
        }
    }
}
