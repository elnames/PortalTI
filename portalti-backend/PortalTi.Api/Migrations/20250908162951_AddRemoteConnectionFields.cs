using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRemoteConnectionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnyDeskId",
                table: "Activos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnyDeskPassword",
                table: "Activos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RustDeskPassword",
                table: "Activos",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnyDeskId",
                table: "Activos");

            migrationBuilder.DropColumn(
                name: "AnyDeskPassword",
                table: "Activos");

            migrationBuilder.DropColumn(
                name: "RustDeskPassword",
                table: "Activos");
        }
    }
}
