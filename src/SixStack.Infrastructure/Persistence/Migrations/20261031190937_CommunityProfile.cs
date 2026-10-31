using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SixStack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CommunityProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "CommunityOrganizers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "SpeakerId",
                table: "CommunityOrganizers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "About",
                table: "Communities",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ActiveSinceYear",
                table: "Communities",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cadence",
                table: "Communities",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Links",
                table: "Communities",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlacesDetail",
                table: "Communities",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlacesLabel",
                table: "Communities",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostingLead",
                table: "Communities",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tagline",
                table: "Communities",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityOrganizers_SpeakerId",
                table: "CommunityOrganizers",
                column: "SpeakerId");

            migrationBuilder.CreateIndex(
                name: "IX_Communities_City",
                table: "Communities",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Communities_Name",
                table: "Communities",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_CommunityOrganizers_Speakers_SpeakerId",
                table: "CommunityOrganizers",
                column: "SpeakerId",
                principalTable: "Speakers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommunityOrganizers_Speakers_SpeakerId",
                table: "CommunityOrganizers");

            migrationBuilder.DropIndex(
                name: "IX_CommunityOrganizers_SpeakerId",
                table: "CommunityOrganizers");

            migrationBuilder.DropIndex(
                name: "IX_Communities_City",
                table: "Communities");

            migrationBuilder.DropIndex(
                name: "IX_Communities_Name",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "CommunityOrganizers");

            migrationBuilder.DropColumn(
                name: "SpeakerId",
                table: "CommunityOrganizers");

            migrationBuilder.DropColumn(
                name: "About",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "ActiveSinceYear",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "Cadence",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "Links",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "PlacesDetail",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "PlacesLabel",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "PostingLead",
                table: "Communities");

            migrationBuilder.DropColumn(
                name: "Tagline",
                table: "Communities");
        }
    }
}
