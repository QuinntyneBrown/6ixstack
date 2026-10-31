using System.Globalization;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.Directory;

/// <summary>The speakers directory (L2-032): search, topic, period (`any`, `month`, `year`) and page.</summary>
public sealed record GetSpeakersQuery(string? Search = null, string? Topic = null, string Period = "any", int Page = 1) : IRequest<SpeakerDirectoryDto>
{
    public const int FirstPageSize = 9;
    public const int PageSize = 24;
    public static readonly string[] Periods = ["any", "month", "year"];
}

public sealed record NextTalkDto(string Title, string DateLabel, string EventSlug);

public sealed record SpeakerCardDto(string Slug, string Name, string Initials, string Role, IReadOnlyList<string> Topics, NextTalkDto? NextTalk);

public sealed record SpeakerDirectoryDto(int ListedTotal, int MatchCount, IReadOnlyList<SpeakerCardDto> Items, bool HasMore, string MonthEndLabel);

public sealed class GetSpeakersQueryValidator : AbstractValidator<GetSpeakersQuery>
{
    public GetSpeakersQueryValidator()
    {
        RuleFor(q => q.Topic).Must(t => t is null || TopicKeys.ByKey.ContainsKey(t)).WithMessage("Unknown topic.");
        RuleFor(q => q.Period).Must(p => GetSpeakersQuery.Periods.Contains(p)).WithMessage("Choose any, month or year.");
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
    }
}

/// <summary>
/// Every speaker, by next talk then name (browse-speakers decisions). Search matches the name, role and company, and
/// talk titles. "This month" keeps speakers with a talk at a published event before the Toronto month ends; "this
/// year" keeps speakers whose talk this year has already happened. Nine cards first, then 24 per page.
/// </summary>
public sealed class GetSpeakersQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetSpeakersQuery, SpeakerDirectoryDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<SpeakerDirectoryDto> Handle(GetSpeakersQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var today = TorontoTime.Today(now);
        var monthEnd = TorontoTime.StartOf(new DateOnly(today.Year, today.Month, 1).AddMonths(1));
        var yearStart = TorontoTime.StartOf(new DateOnly(today.Year, 1, 1));
        var speakers = await db.Speakers.AsNoTracking().ToListAsync(cancellationToken);
        var talks = await db.EventSpeakers.AsNoTracking()
            .Where(t => t.Event!.Status == EventStatus.Published && t.Event.CancelledAtUtc == null)
            .Select(t => new { t.SpeakerId, t.TalkTitle, t.Event!.Slug, t.Event.Title, t.Event.StartsAtUtc })
            .ToListAsync(cancellationToken);
        var bySpeaker = talks.ToLookup(t => t.SpeakerId);

        var search = (request.Search ?? string.Empty).Trim();
        if (search.Length > 100)
        {
            search = search[..100];
        }

        bool Has(string? text) => text is not null && text.Contains(search, StringComparison.OrdinalIgnoreCase);
        var cards = speakers.Select(s =>
        {
            var mine = bySpeaker[s.Id].ToList();
            var next = mine.Where(t => t.StartsAtUtc >= now).OrderBy(t => t.StartsAtUtc).FirstOrDefault();
            return new
            {
                Speaker = s,
                Next = next,
                ThisMonth = mine.Any(t => t.StartsAtUtc >= now && t.StartsAtUtc < monthEnd),
                SpokeThisYear = mine.Any(t => t.StartsAtUtc >= yearStart && t.StartsAtUtc < now),
                Talks = mine.Select(t => t.TalkTitle ?? t.Title),
            };
        })
        .Where(x => search.Length == 0 || Has(x.Speaker.Name) || Has(x.Speaker.Role) || Has(x.Speaker.Affiliation) || x.Talks.Any(Has))
        .Where(x => request.Topic is null || x.Speaker.Topics.HasFlag(TopicKeys.ByKey[request.Topic]))
        .Where(x => request.Period switch { "month" => x.ThisMonth, "year" => x.SpokeThisYear, _ => true })
        .OrderBy(x => x.Next?.StartsAtUtc ?? DateTimeOffset.MaxValue)
        .ThenBy(x => x.Speaker.Name, StringComparer.OrdinalIgnoreCase)
        .ToList();

        var skip = request.Page == 1 ? 0 : GetSpeakersQuery.FirstPageSize + ((request.Page - 2) * GetSpeakersQuery.PageSize);
        var take = request.Page == 1 ? GetSpeakersQuery.FirstPageSize : GetSpeakersQuery.PageSize;
        var items = cards.Skip(skip).Take(take).Select(x => new SpeakerCardDto(
            x.Speaker.Slug,
            x.Speaker.Name,
            x.Speaker.Initials,
            x.Speaker.Role,
            TopicKeys.Of(x.Speaker.Topics),
            x.Next is { } n ? new NextTalkDto(n.TalkTitle ?? n.Title, TorontoTime.ToLocal(n.StartsAtUtc).ToString("ddd, MMM d", En), n.Slug) : null)).ToList();
        var lastDay = new DateOnly(today.Year, today.Month, 1).AddMonths(1).AddDays(-1);
        return new SpeakerDirectoryDto(speakers.Count, cards.Count, items, skip + items.Count < cards.Count, lastDay.ToString("MMMM d", En));
    }
}
