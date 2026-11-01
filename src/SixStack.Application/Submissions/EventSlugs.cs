using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Application.Submissions;

/// <summary>An event's URL slug: the lowercased title with runs of other characters as one hyphen, unique by suffix.</summary>
public static partial class EventSlugs
{
    public static async Task<string> UniqueAsync(IAppDbContext db, string title, CancellationToken cancellationToken)
    {
        var slug = NonSlug().Replace(title.ToLowerInvariant(), "-").Trim('-');
        slug = slug.Length > 100 ? slug[..100].TrimEnd('-') : slug;
        var candidate = slug;
        for (var n = 2; await db.Events.AnyAsync(e => e.Slug == candidate, cancellationToken); n++)
        {
            candidate = $"{slug}-{n}";
        }

        return candidate;
    }

    /// <summary>A new listing with the validated details; the caller sets its status and who submitted it.</summary>
    public static Event NewEvent(EventDetails d, string slug) => new()
    {
        Slug = slug,
        Title = d.Title,
        OrganizerName = d.OrganizerName,
        Description = d.Description,
        Topics = d.Topics,
        Format = d.Format,
        StartsAtUtc = d.StartsAtUtc,
        EndsAtUtc = d.EndsAtUtc,
        TimeZoneId = d.TimeZoneId,
        SourceTimeZoneId = d.TimeZoneId == "America/Toronto" ? null : d.TimeZoneId,
        Venue = d.VenueName is null ? null : new Venue { Name = d.VenueName, Address = d.StreetAddress, City = d.City! },
        StreamUrl = d.StreamUrl,
        TicketUrl = d.TicketUrl,
        PriceCents = d.PriceCents,
    };

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlug();
}
