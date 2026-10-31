using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).HasMaxLength(254).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.Name).HasMaxLength(120);
        builder.Property(u => u.WebsiteUrl).HasMaxLength(300);
        builder.Property(u => u.PendingEmail).HasMaxLength(254);
        builder.Ignore(u => u.Initials);
        builder.OwnsOne(u => u.EmailPreferences, prefs =>
        {
            prefs.Property(p => p.EventDecisions).HasColumnName("EmailEventDecisions").HasDefaultValue(true);
            prefs.Property(p => p.ProblemReports).HasColumnName("EmailProblemReports").HasDefaultValue(true);
            prefs.Property(p => p.WeeklySummary).HasColumnName("EmailWeeklySummary").HasDefaultValue(false);
            prefs.Property(p => p.FollowedCommunities).HasColumnName("EmailFollowedCommunities").HasDefaultValue(false);
        });
        builder.Navigation(u => u.EmailPreferences).IsRequired();
    }
}
