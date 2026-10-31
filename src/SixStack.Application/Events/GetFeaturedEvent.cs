using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

public sealed record FeaturedActionDto(string Label, string Url);

/// <summary>The featured card's labels (L2-006); the card holds no formatting rules.</summary>
public sealed record FeaturedEventDto(
    string Slug,
    string Title,
    string Organizer,
    string Description,
    string MonthLabel,
    string DayOfMonth,
    string LocationLabel,
    bool HasLivestream,
    string WhenLabel,
    FeaturedActionDto PrimaryAction);

/// <summary>This week's featured event, or null (L2-006).</summary>
public sealed record GetFeaturedEventQuery : IRequest<FeaturedEventDto?>;

/// <summary>
/// The published, not cancelled event marked featured that starts in the current Toronto week (Monday to Sunday);
/// the soonest if more than one is marked (featured-event design decisions).
/// </summary>
public sealed class GetFeaturedEventQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetFeaturedEventQuery, FeaturedEventDto?>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<FeaturedEventDto?> Handle(GetFeaturedEventQuery request, CancellationToken cancellationToken)
    {
        var today = TorontoTime.Today(clock.UtcNow);
        var monday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var from = TorontoTime.StartOf(monday);
        var to = TorontoTime.StartOf(monday.AddDays(7));
        var candidates = await db.Events.AsNoTracking().Include(e => e.Community)
            .Where(e => e.IsFeatured && e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= from && e.StartsAtUtc < to)
            .ToListAsync(cancellationToken);
        var e = candidates.OrderBy(x => x.StartsAtUtc).FirstOrDefault();
        if (e is null)
        {
            return null;
        }

        var local = TorontoTime.ToLocal(e.StartsAtUtc);
        var location = e.Venue is { } venue ? $"{venue.Name}, {venue.City}" : "Streaming online";
        var price = e.PriceCents % 100 == 0
            ? (e.PriceCents / 100).ToString(En)
            : (e.PriceCents / 100m).ToString("0.00", En);
        var action = e.PriceCents > 0 ? $"Get tickets · ${price}" : "See the event";
        return new FeaturedEventDto(
            e.Slug,
            e.Title,
            e.Community?.Name ?? e.OrganizerName ?? string.Empty,
            e.Description.Split("\n\n")[0],
            local.ToString("MMM", En),
            local.Day.ToString(CultureInfo.InvariantCulture),
            location,
            e.Format is EventFormat.Streaming or EventFormat.Hybrid,
            $"{local.ToString("ddd", En)} · {TorontoTime.Time(e.StartsAtUtc)}",
            new FeaturedActionDto(action, $"/events/{e.Slug}"));
    }
}
