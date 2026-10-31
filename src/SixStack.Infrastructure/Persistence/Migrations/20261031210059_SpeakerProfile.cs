using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SixStack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SpeakerProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EarlierTalkCount",
                table: "Speakers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Links",
                table: "Speakers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SpeakingSinceYear",
                table: "Speakers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TravelNote",
                table: "Speakers",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EarlierTalkCount",
                table: "Speakers");

            migrationBuilder.DropColumn(
                name: "Links",
                table: "Speakers");

            migrationBuilder.DropColumn(
                name: "SpeakingSinceYear",
                table: "Speakers");

            migrationBuilder.DropColumn(
                name: "TravelNote",
                table: "Speakers");
        }
    }
}
