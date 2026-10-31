using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

public sealed record GetUpcomingEventsQuery(string Format = "all", IReadOnlyList<string>? Topics = null, string? Search = null, int Page = 1)
    : IRequest<UpcomingEventsDto>
{
    public const int UpcomingWindowDays = 14;
    public const int PageSize = 20;
    public const int MaxSearchLength = 100;
}

public sealed record UpcomingEventsDto(
    HeroCountsDto HeroCounts,
    FormatCountsDto FormatCounts,
    IReadOnlyList<DayGroupDto> Days,
    int Shown,
    int Total,
    string? ThroughLabel,
    bool HasMore,
    string Search);

public sealed record HeroCountsDto(int Gta, int Streamable);

public sealed record FormatCountsDto(int All, int Gta, int Streaming);

public sealed record DayGroupDto(string Date, string Weekday, string DateLabel, IReadOnlyList<EventSummaryDto> Events);

public sealed record EventSummaryDto(
    string Slug,
    string Title,
    string Organizer,
    string Format,
    IReadOnlyList<string> Topics,
    string StartTimeEt,
    string? SourceTime,
    string LocationLabel,
    string PriceLabel,
    int GoingCount,
    bool IsSoldOut,
    bool IsCancelled);

public sealed class GetUpcomingEventsQueryValidator : AbstractValidator<GetUpcomingEventsQuery>
{
    private static readonly string[] Formats = ["all", "gta", "streaming"];

    public GetUpcomingEventsQueryValidator()
    {
        RuleFor(q => q.Format).Must(f => Formats.Contains(f, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Choose all, gta or streaming.");
        RuleForEach(q => q.Topics).Must(t => TopicKeys.ByKey.ContainsKey(t)).WithMessage("Unknown topic.");
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
    }
}

/// <summary>
/// Published, non-cancelled upcoming events (L2-001): the 14-day window first, then pages of 20 (L2-009), with
/// format counts after topic and search filters (L2-002) and hero counts over the whole window (L2-007).
/// </summary>
public sealed class GetUpcomingEventsQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetUpcomingEventsQuery, UpcomingEventsDto>
{
    public async Task<UpcomingEventsDto> Handle(GetUpcomingEventsQuery request, CancellationToken cancellationToken)
    {
        var today = TorontoTime.Today(clock.UtcNow);
        var from = TorontoTime.StartOf(today);
        var windowEnd = TorontoTime.StartOf(today.AddDays(GetUpcomingEventsQuery.UpcomingWindowDays));
        var search = (request.Search ?? string.Empty).Trim();
        if (search.Length > GetUpcomingEventsQuery.MaxSearchLength)
        {
            search = search[..GetUpcomingEventsQuery.MaxSearchLength];
        }

        var upcoming = db.Events.AsNoTracking()
            .Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= from);

        var heroFormats = await upcoming.Where(e => e.StartsAtUtc < windowEnd).Select(e => e.Format).ToListAsync(cancellationToken);
        var hero = new HeroCountsDto(heroFormats.Count(IsGta), heroFormats.Count(IsStreamable));

        var filtered = ApplyTopics(ApplySearch(upcoming, search), request.Topics);
        var window = await filtered.Where(e => e.StartsAtUtc < windowEnd)
            .Include(e => e.Community)
            .OrderBy(e => e.StartsAtUtc)
            .ToListAsync(cancellationToken);
        var counts = new FormatCountsDto(window.Count, window.Count(e => IsGta(e.Format)), window.Count(e => IsStreamable(e.Format)));

        var matching = ApplyFormat(filtered, request.Format.ToLowerInvariant());
        var total = await matching.CountAsync(cancellationToken);
        var windowMatches = window.Where(e => MatchesFormat(e.Format, request.Format.ToLowerInvariant())).ToList();

        List<Event> pageItems;
        int shown;
        if (request.Page == 1)
        {
            pageItems = windowMatches;
            shown = windowMatches.Count;
        }
        else
        {
            var skip = (request.Page - 2) * GetUpcomingEventsQuery.PageSize;
            pageItems = await matching.Where(e => e.StartsAtUtc >= windowEnd)
                .Include(e => e.Community)
                .OrderBy(e => e.StartsAtUtc)
                .Skip(skip)
                .Take(GetUpcomingEventsQuery.PageSize)
                .ToListAsync(cancellationToken);
            shown = windowMatches.Count + skip + pageItems.Count;
        }

        string? through = null;
        if (total > 0)
        {
            var last = await matching.OrderByDescending(e => e.StartsAtUtc).Select(e => e.StartsAtUtc).FirstAsync(cancellationToken);
            through = TorontoTime.MonthDay(DateOnly.FromDateTime(TorontoTime.ToLocal(last)));
        }

        return new UpcomingEventsDto(hero, counts, GroupByDay(pageItems), shown, total, through, shown < total, search);
    }

    internal static IReadOnlyList<DayGroupDto> GroupByDay(IEnumerable<Event> events) =>
        [.. events
            .GroupBy(e => DateOnly.FromDateTime(TorontoTime.ToLocal(e.StartsAtUtc)))
            .OrderBy(g => g.Key)
            .Select(g => new DayGroupDto(
                g.Key.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
                TorontoTime.Weekday(g.Key),
                TorontoTime.MonthDay(g.Key),
                [.. g.OrderBy(e => e.StartsAtUtc).Select(ToSummary)]))];

    internal static EventSummaryDto ToSummary(Event e) => new(
        e.Slug,
        e.Title,
        e.Community?.Name ?? string.Empty,
        EventLabels.Format(e.Format),
        TopicKeys.Of(e.Topics),
        TorontoTime.Time(e.StartsAtUtc),
        e.SourceTimeZoneId is null || e.Format == EventFormat.InPerson ? null : TorontoTime.TimeIn(e.StartsAtUtc, e.SourceTimeZoneId),
        EventLabels.Location(e),
        EventLabels.Price(e),
        e.GoingCount,
        e.IsSoldOut,
        e.IsCancelled);

    internal static bool IsGta(EventFormat f) => f is EventFormat.InPerson or EventFormat.Hybrid;

    internal static bool IsStreamable(EventFormat f) => f is EventFormat.Streaming or EventFormat.Hybrid;

    internal static bool MatchesFormat(EventFormat f, string format) => format switch
    {
        "gta" => IsGta(f),
        "streaming" => IsStreamable(f),
        _ => true,
    };

    private static IQueryable<Event> ApplyFormat(IQueryable<Event> events, string format) => format switch
    {
        "gta" => events.Where(e => e.Format == EventFormat.InPerson || e.Format == EventFormat.Hybrid),
        "streaming" => events.Where(e => e.Format == EventFormat.Streaming || e.Format == EventFormat.Hybrid),
        _ => events,
    };

    private static IQueryable<Event> ApplyTopics(IQueryable<Event> events, IReadOnlyList<string>? topics)
    {
        if (topics is null || topics.Count == 0)
        {
            return events;
        }

        var mask = TopicKeys.Parse(topics);
        return events.Where(e => (e.Topics & mask) != Topics.None);
    }

    private static IQueryable<Event> ApplySearch(IQueryable<Event> events, string search)
    {
        if (search.Length == 0)
        {
            return events;
        }

        var q = search.ToLower();
        return events.Where(e =>
            e.Title.ToLower().Contains(q)
            || e.Description.ToLower().Contains(q)
            || e.Community!.Name.ToLower().Contains(q)
            || (e.Venue != null && (e.Venue.Name.ToLower().Contains(q) || e.Venue.City.ToLower().Contains(q))));
    }
}
