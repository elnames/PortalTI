using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalTi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFechaSubidaToActa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La columna FechaSubida ya fue creada en la migración AddActasTable
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // La columna FechaSubida ya fue creada en la migración AddActasTable
        }
    }
}
