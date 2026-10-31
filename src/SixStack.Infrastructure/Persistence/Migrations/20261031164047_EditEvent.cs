using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SixStack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EditEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastEditedAtUtc",
                table: "Events",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Details",
                table: "AuditEntries",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastEditedAtUtc",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Details",
                table: "AuditEntries");
        }
    }
}
