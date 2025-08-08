using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActivoIdToTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActivoId",
                table: "Tickets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ActivoId",
                table: "Tickets",
                column: "ActivoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Activos_ActivoId",
                table: "Tickets",
                column: "ActivoId",
                principalTable: "Activos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Activos_ActivoId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_ActivoId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "ActivoId",
                table: "Tickets");
        }
    }
}
