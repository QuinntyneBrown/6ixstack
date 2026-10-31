using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class SubmissionCheckConfiguration : IEntityTypeConfiguration<SubmissionCheck>
{
    public void Configure(EntityTypeBuilder<SubmissionCheck> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Message).HasMaxLength(200);
        builder.HasOne<Event>().WithMany().HasForeignKey(c => c.EventId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(c => c.EventId);
    }
}

public sealed class ModerationDecisionConfiguration : IEntityTypeConfiguration<ModerationDecision>
{
    public void Configure(EntityTypeBuilder<ModerationDecision> builder)
    {
        builder.HasKey(d => d.Id);
        builder.HasOne(d => d.Event).WithMany().HasForeignKey(d => d.EventId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(d => d.DecidedAtUtc);
    }
}
