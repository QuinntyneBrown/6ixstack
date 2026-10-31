using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class ProblemReportConfiguration : IEntityTypeConfiguration<ProblemReport>
{
    public void Configure(EntityTypeBuilder<ProblemReport> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Details).HasMaxLength(2000);
        builder.Property(r => r.ReplyEmail).HasMaxLength(254);
        builder.HasOne(r => r.Event).WithMany().HasForeignKey(r => r.EventId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(r => new { r.EventId, r.CreatedAtUtc });
    }
}
