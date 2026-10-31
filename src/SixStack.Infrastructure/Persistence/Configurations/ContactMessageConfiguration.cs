using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Name).HasMaxLength(120);
        builder.Property(m => m.Email).HasMaxLength(254);
        builder.Property(m => m.Topic).HasMaxLength(20);
        builder.Property(m => m.Message).HasMaxLength(5000);
        builder.HasIndex(m => m.CreatedAtUtc);
    }
}
