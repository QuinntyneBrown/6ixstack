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

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.RecipientEmail).HasMaxLength(254);
        builder.Property(n => n.Title).HasMaxLength(200);
        builder.Property(n => n.Text).HasMaxLength(500);
        builder.Property(n => n.Link).HasMaxLength(300);
        builder.HasIndex(n => new { n.RecipientEmail, n.CreatedAtUtc });
    }
}

public sealed class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.HasKey(a => a.Sequence);
        builder.Property(a => a.Sequence).ValueGeneratedOnAdd();
        builder.Property(a => a.Action).HasMaxLength(60);
        builder.Property(a => a.TargetType).HasMaxLength(60);
        builder.HasIndex(a => a.TargetId);
    }
}

public sealed class ReviewPresenceConfiguration : IEntityTypeConfiguration<ReviewPresence>
{
    public void Configure(EntityTypeBuilder<ReviewPresence> builder) => builder.HasKey(p => new { p.EventId, p.ModeratorId });
}
