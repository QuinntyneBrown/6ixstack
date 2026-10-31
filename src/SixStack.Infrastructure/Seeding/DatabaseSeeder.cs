using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;
using SixStack.Infrastructure.Persistence;

namespace SixStack.Infrastructure.Seeding;

/// <summary>Adds the mock cast. Rows that already exist (by slug or email) are left alone, so it is safe to re-run.</summary>
public sealed class DatabaseSeeder(AppDbContext db, IClock clock)
{
    private static readonly TimeZoneInfo Toronto = TimeZoneInfo.FindSystemTimeZoneById("America/Toronto");

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var communities = await db.Communities.ToDictionaryAsync(c => c.Slug, cancellationToken);
        foreach (var seed in SeedData.Communities.Where(s => !communities.ContainsKey(s.Slug)))
        {
            var community = new Community
            {
                Slug = seed.Slug, Name = seed.Name, Initials = seed.Initials, City = seed.City,
                MemberCount = seed.Members, Topics = seed.Topics, Description = seed.Description,
            };
            db.Communities.Add(community);
            communities[seed.Slug] = community;
        }

        var speakers = await db.Speakers.ToDictionaryAsync(s => s.Slug, cancellationToken);
        foreach (var seed in SeedData.Speakers.Where(s => !speakers.ContainsKey(s.Slug)))
        {
            var speaker = new Speaker
            {
                Slug = seed.Slug, Name = seed.Name, Initials = seed.Initials, Role = seed.Role,
                Affiliation = seed.Affiliation, Topics = seed.Topics, HomeCity = seed.HomeCity,
            };
            db.Speakers.Add(speaker);
            speakers[seed.Slug] = speaker;
        }

        var users = await db.Users.ToDictionaryAsync(u => u.Email, cancellationToken);
        if (!users.ContainsKey(SeedData.OrganizerEmail))
        {
            var priya = new User { Email = SeedData.OrganizerEmail, Name = "Priya Natarajan", Role = UserRole.Organizer, CreatedAtUtc = clock.UtcNow };
            priya.Communities.Add(new CommunityOrganizer { Community = communities["gta-azure-community"], Role = "Organizer" });
            db.Users.Add(priya);
        }

        if (!users.ContainsKey(SeedData.ModeratorEmail))
        {
            db.Users.Add(new User { Email = SeedData.ModeratorEmail, Name = "Jordan Lee", Role = UserRole.Moderator, CreatedAtUtc = clock.UtcNow });
        }

        var existingEvents = await db.Events.Select(e => e.Slug).ToHashSetAsync(cancellationToken);
        foreach (var seed in SeedData.Events.Where(s => !existingEvents.Contains(s.Slug)))
        {
            var startsAt = ToUtc(seed.Date, seed.Start);
            var item = new Event
            {
                Slug = seed.Slug,
                Title = seed.Title,
                Description = seed.Description,
                Community = communities[seed.Community],
                Status = seed.Status,
                Format = seed.Format,
                Topics = seed.Topics,
                StartsAtUtc = startsAt,
                EndsAtUtc = ToUtc(seed.Date, seed.End),
                SourceTimeZoneId = seed.SourceTimeZoneId,
                Venue = seed.Venue is null ? null : new Venue
                {
                    Name = seed.Venue.Name, Address = seed.Venue.Address, City = seed.Venue.City,
                    Latitude = seed.Venue.Latitude, Longitude = seed.Venue.Longitude,
                },
                PriceCents = seed.PriceCents,
                GoingCount = seed.Going,
                IsFeatured = seed.Featured,
                SubmitterEmail = seed.SubmitterEmail,
                SubmittedAtUtc = startsAt.AddDays(-21),
                PublishedAtUtc = seed.Status == EventStatus.Published ? startsAt.AddDays(-20) : null,
                TicketUrl = seed.Status == EventStatus.Published && seed.Format != EventFormat.Streaming ? $"https://tickets.example.com/{seed.Slug}" : null,
                StreamUrl = seed.Format != EventFormat.InPerson ? $"https://stream.example.com/{seed.Slug}" : null,
            };
            foreach (var (speakerSlug, talk) in seed.Speakers ?? [])
            {
                item.Speakers.Add(new EventSpeaker { Speaker = speakers[speakerSlug], TalkTitle = talk, Order = item.Speakers.Count });
            }

            seed.Details?.Invoke(item);
            db.Events.Add(item);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static DateTimeOffset ToUtc(string date, string time)
    {
        var local = DateTime.Parse($"{date}T{time}:00", System.Globalization.CultureInfo.InvariantCulture);
        var offset = Toronto.GetUtcOffset(local);
        return new DateTimeOffset(local, offset).ToUniversalTime();
    }
}
