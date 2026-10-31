using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class CommunityConfiguration : IEntityTypeConfiguration<Community>
{
    public void Configure(EntityTypeBuilder<Community> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Slug).HasMaxLength(120).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique();
        builder.Property(c => c.Name).HasMaxLength(120).IsRequired();
        builder.Property(c => c.Initials).HasMaxLength(4);
        builder.Property(c => c.Description).HasMaxLength(1000);
        builder.Property(c => c.City).HasMaxLength(100);
        builder.Property(c => c.WebsiteUrl).HasMaxLength(2048);
    }
}

public sealed class CommunityOrganizerConfiguration : IEntityTypeConfiguration<CommunityOrganizer>
{
    public void Configure(EntityTypeBuilder<CommunityOrganizer> builder)
    {
        builder.HasKey(co => new { co.CommunityId, co.UserId });
        builder.Property(co => co.Role).HasMaxLength(60);
        builder.HasOne(co => co.Community).WithMany(c => c.Organizers).HasForeignKey(co => co.CommunityId);
        builder.HasOne(co => co.User).WithMany(u => u.Communities).HasForeignKey(co => co.UserId);
    }
}
