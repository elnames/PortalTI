using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActaIntegrityAndConcurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ComentariosRechazo",
                table: "Actas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaRechazo",
                table: "Actas",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PdfHash",
                table: "Actas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RechazadoPorId",
                table: "Actas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Actas",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "IX_Actas_RechazadoPorId",
                table: "Actas",
                column: "RechazadoPorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actas_AuthUsers_RechazadoPorId",
                table: "Actas",
                column: "RechazadoPorId",
                principalTable: "AuthUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Actas_AuthUsers_RechazadoPorId",
                table: "Actas");

            migrationBuilder.DropIndex(
                name: "IX_Actas_RechazadoPorId",
                table: "Actas");

            migrationBuilder.DropColumn(
                name: "ComentariosRechazo",
                table: "Actas");

            migrationBuilder.DropColumn(
                name: "FechaRechazo",
                table: "Actas");

            migrationBuilder.DropColumn(
                name: "PdfHash",
                table: "Actas");

            migrationBuilder.DropColumn(
                name: "RechazadoPorId",
                table: "Actas");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Actas");
        }
    }
}
