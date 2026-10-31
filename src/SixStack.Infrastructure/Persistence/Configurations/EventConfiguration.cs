using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence.Configurations;

public sealed class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Slug).HasMaxLength(120).IsRequired();
        builder.HasIndex(e => e.Slug).IsUnique();
        builder.HasIndex(e => new { e.Status, e.StartsAtUtc });
        builder.Property(e => e.Title).HasMaxLength(120).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(4000);
        builder.Property(e => e.TimeZoneId).HasMaxLength(64);
        builder.Property(e => e.SourceTimeZoneId).HasMaxLength(64);
        builder.Property(e => e.TicketUrl).HasMaxLength(2048);
        builder.Property(e => e.StreamUrl).HasMaxLength(2048);
        builder.Property(e => e.RecordingUrl).HasMaxLength(2048);
        builder.Property(e => e.SubmitterEmail).HasMaxLength(254);
        builder.Property(e => e.CancellationReason).HasMaxLength(500);
        builder.Property(e => e.PriceNote).HasMaxLength(120);
        builder.Property(e => e.PriceDetail).HasMaxLength(200);
        builder.Property(e => e.LivestreamNote).HasMaxLength(200);
        builder.Property(e => e.SlidesUrl).HasMaxLength(2048);
        builder.Property(e => e.NoteTitle).HasMaxLength(120);
        builder.Property(e => e.NoteText).HasMaxLength(500);
        builder.OwnsMany(e => e.AgendaItems, agenda =>
        {
            agenda.ToTable("EventAgendaItems");
            agenda.WithOwner().HasForeignKey("EventId");
            agenda.Property<int>("Id");
            agenda.HasKey("Id");
            agenda.Property(a => a.Title).HasMaxLength(200);
        });
        builder.Ignore(e => e.IsCancelled);
        builder.HasOne(e => e.Community).WithMany().HasForeignKey(e => e.CommunityId).OnDelete(DeleteBehavior.Restrict);
        builder.OwnsOne(e => e.Venue, venue =>
        {
            venue.Property(v => v.Name).HasMaxLength(200);
            venue.Property(v => v.Address).HasMaxLength(200);
            venue.Property(v => v.City).HasMaxLength(100);
            venue.Property(v => v.TravelNotes).HasMaxLength(300);
        });
    }
}
