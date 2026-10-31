using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class SpeakerConfiguration : IEntityTypeConfiguration<Speaker>
{
    public void Configure(EntityTypeBuilder<Speaker> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Slug).HasMaxLength(120).IsRequired();
        builder.HasIndex(s => s.Slug).IsUnique();
        builder.Property(s => s.Name).HasMaxLength(120).IsRequired();
        builder.Property(s => s.Initials).HasMaxLength(4);
        builder.Property(s => s.Role).HasMaxLength(200);
        builder.Property(s => s.Affiliation).HasMaxLength(200);
        builder.Property(s => s.Bio).HasMaxLength(2000);
        builder.Property(s => s.HomeCity).HasMaxLength(100);
        builder.Property(s => s.PublicContactEmail).HasMaxLength(254);
    }
}

public sealed class EventSpeakerConfiguration : IEntityTypeConfiguration<EventSpeaker>
{
    public void Configure(EntityTypeBuilder<EventSpeaker> builder)
    {
        builder.HasKey(es => new { es.EventId, es.SpeakerId });
        builder.Property(es => es.TalkTitle).HasMaxLength(200);
        builder.HasOne(es => es.Event).WithMany(e => e.Speakers).HasForeignKey(es => es.EventId);
        builder.HasOne(es => es.Speaker).WithMany().HasForeignKey(es => es.SpeakerId);
    }
}
