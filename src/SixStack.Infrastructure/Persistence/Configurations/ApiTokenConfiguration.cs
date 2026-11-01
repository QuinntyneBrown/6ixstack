using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

/// <summary>API tokens (event-admin-api design): deleted with their owner's account (L2-100, L2-120).</summary>
public sealed class ApiTokenConfiguration : IEntityTypeConfiguration<ApiToken>
{
    public void Configure(EntityTypeBuilder<ApiToken> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).HasMaxLength(ApiToken.NameMaxLength).IsRequired();
        builder.Property(t => t.Salt).HasMaxLength(32).IsRequired();
        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(t => t.UserId);
    }
}
