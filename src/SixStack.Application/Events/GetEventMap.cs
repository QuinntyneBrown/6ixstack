using System.Globalization;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

/// <summary>The "Where it's happening" map for the list's filters (L2-011, L2-013).</summary>
public sealed record GetEventMapQuery(string Format = "all", IReadOnlyList<string>? Topics = null, string? Search = null) : IRequest<EventMapDto>;

public sealed record MapPointDto(string Slug, string Title, string Date, IReadOnlyList<string> Topics, string FirstTopic, string CardMeta, double Latitude, double Longitude, bool IsHybrid);

public sealed record MapStreamDto(string Slug, string Title, string Date, IReadOnlyList<string> Topics, string FirstTopic, string CardMeta, string OriginCity, string OriginSide, string? SourceTime);

public sealed record MapDayDotDto(string Topic, bool IsStream);

public sealed record MapDayDto(string Date, string WeekdayLetter, int DayOfMonth, string Label, int Count, IReadOnlyList<MapDayDotDto> Dots);

public sealed record EventMapDto(IReadOnlyList<MapPointDto> Points, IReadOnlyList<MapStreamDto> Streams, IReadOnlyList<MapDayDto> Days);

public sealed class GetEventMapQueryValidator : AbstractValidator<GetEventMapQuery>
{
    private static readonly string[] Formats = ["all", "gta", "streaming"];

    public GetEventMapQueryValidator()
    {
        RuleFor(q => q.Format).Must(f => Formats.Contains(f, StringComparer.OrdinalIgnoreCase)).WithMessage("Choose all, gta or streaming.");
        RuleForEach(q => q.Topics).Must(t => TopicKeys.ByKey.ContainsKey(t)).WithMessage("Unknown topic.");
    }
}

/// <summary>
/// The events the list's first page shows (published, not cancelled, in the 14-day window, filtered): a dot for each
/// GTA event whose venue has coordinates, an arc for each streaming-only event, and the 14 timeline days. "First
/// topic" follows the fixed topic order; a stream comes from the west when its source zone is behind Toronto.
/// </summary>
public sealed class GetEventMapQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetEventMapQuery, EventMapDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<EventMapDto> Handle(GetEventMapQuery request, CancellationToken cancellationToken)
    {
        var today = TorontoTime.Today(clock.UtcNow);
        var from = TorontoTime.StartOf(today);
        var to = TorontoTime.StartOf(today.AddDays(GetUpcomingEventsQuery.UpcomingWindowDays));
        var search = (request.Search ?? string.Empty).Trim();
        if (search.Length > GetUpcomingEventsQuery.MaxSearchLength)
        {
            search = search[..GetUpcomingEventsQuery.MaxSearchLength];
        }

        var query = db.Events.AsNoTracking()
            .Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= from && e.StartsAtUtc < to);
        query = GetUpcomingEventsQueryHandler.ApplyFormat(
            GetUpcomingEventsQueryHandler.ApplyTopics(GetUpcomingEventsQueryHandler.ApplySearch(query, search), request.Topics),
            request.Format.ToLowerInvariant());
        var events = (await query.ToListAsync(cancellationToken)).OrderBy(e => e.StartsAtUtc).ToList();

        var points = events
            .Where(e => e.Format != EventFormat.Streaming && e.Venue is { Latitude: not null, Longitude: not null })
            .Select(e => new MapPointDto(e.Slug, e.Title, Date(e), TopicKeys.Of(e.Topics), First(e), CardMeta(e),
                e.Venue!.Latitude!.Value, e.Venue.Longitude!.Value, e.Format == EventFormat.Hybrid))
            .ToList();
        var streams = events
            .Where(e => e.Format == EventFormat.Streaming)
            .Select(e => new MapStreamDto(e.Slug, e.Title, Date(e), TopicKeys.Of(e.Topics), First(e), CardMeta(e),
                e.StreamOriginCity ?? "Online", Side(e), GetUpcomingEventsQueryHandler.ToSummary(e).SourceTime))
            .ToList();
        var days = Enumerable.Range(0, GetUpcomingEventsQuery.UpcomingWindowDays).Select(i =>
        {
            var day = today.AddDays(i);
            var key = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var onDay = events.Where(e => Date(e) == key).ToList();
            return new MapDayDto(
                key,
                day.DayOfWeek.ToString()[..1],
                day.Day,
                $"{day.ToString("dddd, MMMM d", En)}",
                onDay.Count,
                [.. onDay.Take(4).Select(e => new MapDayDotDto(First(e), e.Format == EventFormat.Streaming))]);
        }).ToList();
        return new EventMapDto(points, streams, days);
    }

    private static string Date(Event e) => TorontoTime.ToLocal(e.StartsAtUtc).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private static string First(Event e) => TopicKeys.Of(e.Topics).FirstOrDefault() ?? "ai";

    private static string CardMeta(Event e) => $"{TorontoTime.ToLocal(e.StartsAtUtc).ToString("ddd MMM d", En)} · {TorontoTime.Time(e.StartsAtUtc)}";

    /// <summary>West when the stream's source zone is behind Toronto at the event's start, east otherwise.</summary>
    private static string Side(Event e)
    {
        if (e.SourceTimeZoneId is null)
        {
            return "east";
        }

        var source = TimeZoneInfo.FindSystemTimeZoneById(e.SourceTimeZoneId).GetUtcOffset(e.StartsAtUtc);
        var toronto = TimeZoneInfo.FindSystemTimeZoneById("America/Toronto").GetUtcOffset(e.StartsAtUtc);
        return source < toronto ? "west" : "east";
    }
}
