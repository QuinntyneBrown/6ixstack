using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Application.Events;
using SixStack.Domain.Enums;

namespace SixStack.Application.Directory;

public sealed record SpeakerCommunityDto(string RoleLabel, string Name, string Slug);

/// <summary>An upcoming talk as an event row: the talk title, its time from the agenda, and the event's facts.</summary>
public sealed record UpcomingTalkDto(
    string Slug,
    string Title,
    string Organizer,
    string Date,
    string StartTimeEt,
    string Format,
    IReadOnlyList<string> Topics,
    string LocationLabel,
    string PriceLabel,
    int GoingCount);

public sealed record PastTalkDto(string Title, string Meta, string EventSlug, string? RecordingUrl);

public sealed record SpeakerFactsDto(string TalkCountLabel, string? SinceLabel, string? HomeCity, string? HomeCityNote, IReadOnlyList<CommunityWebLinkDto> Links);

public sealed record SpeakerDetailDto(
    string Slug,
    string Name,
    string Initials,
    string Role,
    SpeakerCommunityDto? Community,
    IReadOnlyList<string> Topics,
    IReadOnlyList<string> Bio,
    IReadOnlyList<UpcomingTalkDto> Upcoming,
    IReadOnlyList<PastTalkDto> Past,
    SpeakerFactsDto Facts,
    string? InviteUrl);

/// <summary>A speaker's page (L2-033); 404 for an unknown slug.</summary>
public sealed record GetSpeakerQuery(string Slug) : IRequest<SpeakerDetailDto>;

/// <summary>
/// The profile, upcoming talks (time from the matching agenda item, else the event's start), the five most recent past
/// talks with a recording link when there is one, the facts and Invite to speak only with a public contact address
/// (view-speaker decisions).
/// </summary>
public sealed class GetSpeakerQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetSpeakerQuery, SpeakerDetailDto>
{
    public const int PastShown = 5;
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<SpeakerDetailDto> Handle(GetSpeakerQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var s = await db.Speakers.AsNoTracking().SingleOrDefaultAsync(x => x.Slug == request.Slug, cancellationToken)
            ?? throw new NotFoundException("Speaker not found.");
        var talks = await db.EventSpeakers.AsNoTracking()
            .Include(t => t.Event!).ThenInclude(e => e.Community)
            .Include(t => t.Event!).ThenInclude(e => e.AgendaItems)
            .Where(t => t.SpeakerId == s.Id && t.Event!.Status == EventStatus.Published && t.Event.CancelledAtUtc == null)
            .ToListAsync(cancellationToken);
        var organizes = await db.CommunityOrganizers.AsNoTracking().Include(o => o.Community)
            .Where(o => o.SpeakerId == s.Id)
            .OrderBy(o => o.SortOrder)
            .FirstOrDefaultAsync(cancellationToken);

        var upcoming = talks.Where(t => t.Event!.StartsAtUtc >= now).OrderBy(t => t.Event!.StartsAtUtc).Select(t =>
        {
            var e = t.Event!;
            var summary = GetUpcomingEventsQueryHandler.ToSummary(e);
            var title = t.TalkTitle ?? e.Title;
            var slot = e.AgendaItems.FirstOrDefault(a => a.Title.StartsWith(title, StringComparison.OrdinalIgnoreCase));
            var time = slot is null ? summary.StartTimeEt : slot.StartsAtLocal.ToString("h:mm tt", En);
            return new UpcomingTalkDto(
                e.Slug,
                title,
                $"{e.Title} · {e.Community?.Name ?? e.OrganizerName}",
                TorontoTime.ToLocal(e.StartsAtUtc).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                time,
                summary.Format,
                summary.Topics,
                summary.LocationLabel,
                summary.PriceLabel,
                e.GoingCount);
        }).ToList();
        var past = talks.Where(t => t.Event!.StartsAtUtc < now).OrderByDescending(t => t.Event!.StartsAtUtc).Take(PastShown)
            .Select(t => new PastTalkDto(
                t.TalkTitle ?? t.Event!.Title,
                $"{t.Event!.Community?.Name ?? t.Event.OrganizerName} · {TorontoTime.ToLocal(t.Event.StartsAtUtc).ToString("MMM d, yyyy", En)}",
                t.Event.Slug,
                t.Event.RecordingUrl))
            .ToList();
        var count = s.EarlierTalkCount + talks.Count;
        var facts = new SpeakerFactsDto(
            $"{count.ToString("N0", En)} {(count == 1 ? "talk" : "talks")}",
            s.SpeakingSinceYear is { } since ? $"Since {since}" : null,
            s.HomeCity,
            s.TravelNote,
            [.. s.Links.Select(l => new CommunityWebLinkDto(l.Label, l.Url))]);
        return new SpeakerDetailDto(
            s.Slug,
            s.Name,
            s.Initials,
            s.Role,
            organizes?.Community is { } c ? new SpeakerCommunityDto(organizes.Role, c.Name, c.Slug) : null,
            TopicKeys.Of(s.Topics),
            (s.Bio ?? string.Empty).Split("\n\n", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            upcoming,
            past,
            facts,
            string.IsNullOrWhiteSpace(s.PublicContactEmail) ? null : $"mailto:{s.PublicContactEmail}");
    }
}
