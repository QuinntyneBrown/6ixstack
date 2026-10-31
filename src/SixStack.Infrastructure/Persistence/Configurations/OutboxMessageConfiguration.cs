using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Type).HasMaxLength(500).IsRequired();
        builder.Property(m => m.CorrelationId).HasMaxLength(64);
        builder.Property(m => m.LastError).HasMaxLength(2000);
        builder.HasIndex(m => new { m.ProcessedAtUtc, m.FailedAtUtc, m.NextAttemptAtUtc });
    }
}
