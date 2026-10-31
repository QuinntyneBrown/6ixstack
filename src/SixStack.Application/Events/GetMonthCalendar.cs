using System.Globalization;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.Events;

public sealed record MonthTotalsDto(int Events, int Gta, int Streaming);

public sealed record CalendarEventDto(string Slug, string Title, string? FirstTopic, string StartTimeEt);

public sealed record CalendarDayDto(string Date, IReadOnlyList<CalendarEventDto> Events);

/// <summary>One Toronto month for the calendar grid: totals for the subtitle, filter counts, and the matching days.</summary>
public sealed record MonthCalendarDto(
    string Month,
    string MonthLabel,
    MonthTotalsDto Totals,
    FormatCountsDto Counts,
    int MatchCount,
    IReadOnlyList<CalendarDayDto> Days);

/// <summary>The month calendar (L2-025, L2-027): published, not cancelled events starting in a Toronto month.</summary>
public sealed record GetMonthCalendarQuery(string? Month, string Format = "all", IReadOnlyList<string>? Topics = null) : IRequest<MonthCalendarDto>
{
    public static bool TryParse(string? month, out DateOnly first) =>
        DateOnly.TryParseExact(month + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out first)
        && first.Year is >= 2000 and <= 2100;
}

public sealed class GetMonthCalendarQueryValidator : AbstractValidator<GetMonthCalendarQuery>
{
    private static readonly string[] Formats = ["all", "gta", "streaming"];

    public GetMonthCalendarQueryValidator()
    {
        RuleFor(q => q.Month).Must(m => GetMonthCalendarQuery.TryParse(m, out _)).WithMessage("Use a month like 2026-11.");
        RuleFor(q => q.Format).Must(f => Formats.Contains(f, StringComparer.OrdinalIgnoreCase)).WithMessage("Unknown format.");
        RuleForEach(q => q.Topics).Must(t => TopicKeys.ByKey.ContainsKey(t)).WithMessage("Unknown topic.");
    }
}

public sealed class GetMonthCalendarQueryHandler(IAppDbContext db) : IRequestHandler<GetMonthCalendarQuery, MonthCalendarDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<MonthCalendarDto> Handle(GetMonthCalendarQuery request, CancellationToken cancellationToken)
    {
        GetMonthCalendarQuery.TryParse(request.Month, out var first);
        var from = TorontoTime.StartOf(first);
        var to = TorontoTime.StartOf(first.AddMonths(1));
        var month = (await db.Events.AsNoTracking()
                .Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= from && e.StartsAtUtc < to)
                .ToListAsync(cancellationToken))
            .OrderBy(e => e.StartsAtUtc)
            .ThenBy(e => e.Title, StringComparer.Ordinal)
            .ToList();

        var mask = TopicKeys.Parse(request.Topics ?? []);
        var topical = mask == Topics.None ? month : month.Where(e => (e.Topics & mask) != Topics.None).ToList();
        var format = request.Format.ToLowerInvariant();
        var matching = topical.Where(e => GetUpcomingEventsQueryHandler.MatchesFormat(e.Format, format)).ToList();

        return new MonthCalendarDto(
            first.ToString("yyyy-MM", CultureInfo.InvariantCulture),
            first.ToString("MMMM yyyy", En),
            new MonthTotalsDto(month.Count, month.Count(e => GetUpcomingEventsQueryHandler.IsGta(e.Format)), month.Count(e => GetUpcomingEventsQueryHandler.IsStreamable(e.Format))),
            new FormatCountsDto(topical.Count, topical.Count(e => GetUpcomingEventsQueryHandler.IsGta(e.Format)), topical.Count(e => GetUpcomingEventsQueryHandler.IsStreamable(e.Format))),
            matching.Count,
            [.. matching
                .GroupBy(e => DateOnly.FromDateTime(TorontoTime.ToLocal(e.StartsAtUtc)))
                .Select(g => new CalendarDayDto(
                    g.Key.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    [.. g.Select(e => new CalendarEventDto(e.Slug, e.Title, TopicKeys.Of(e.Topics).FirstOrDefault(), TorontoTime.Time(e.StartsAtUtc)))]))]);
    }
}
