using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class SecurityTokenConfiguration : IEntityTypeConfiguration<SecurityToken>
{
    public void Configure(EntityTypeBuilder<SecurityToken> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Email).HasMaxLength(254).IsRequired();
        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.HasIndex(t => new { t.Email, t.Purpose, t.CreatedAtUtc });
        builder.Property(t => t.ReturnUrl).HasMaxLength(500);
    }
}

public sealed class VerifiedEmailConfiguration : IEntityTypeConfiguration<VerifiedEmail>
{
    public void Configure(EntityTypeBuilder<VerifiedEmail> builder)
    {
        builder.HasKey(v => v.NormalizedEmail);
        builder.Property(v => v.NormalizedEmail).HasMaxLength(254);
    }
}
