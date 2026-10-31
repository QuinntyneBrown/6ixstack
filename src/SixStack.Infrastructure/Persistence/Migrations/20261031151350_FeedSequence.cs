using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SixStack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FeedSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Sequence",
                table: "Events",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sequence",
                table: "Events");
        }
    }
}
