using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SixStack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Submissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "CommunityId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ApprovedAtUtc",
                table: "Events",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrganizerName",
                table: "Events",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SecurityTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Purpose = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UsedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VerifiedEmails",
                columns: table => new
                {
                    NormalizedEmail = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    VerifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerifiedEmails", x => x.NormalizedEmail);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_SubmitterEmail",
                table: "Events",
                column: "SubmitterEmail");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityTokens_Email_Purpose_CreatedAtUtc",
                table: "SecurityTokens",
                columns: new[] { "Email", "Purpose", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_SecurityTokens_TokenHash",
                table: "SecurityTokens",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SecurityTokens");

            migrationBuilder.DropTable(
                name: "VerifiedEmails");

            migrationBuilder.DropIndex(
                name: "IX_Events_SubmitterEmail",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "OrganizerName",
                table: "Events");

            migrationBuilder.AlterColumn<Guid>(
                name: "CommunityId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
