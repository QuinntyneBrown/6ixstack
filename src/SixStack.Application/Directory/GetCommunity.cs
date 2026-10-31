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

public sealed record PastEventDto(string Slug, string Title, string DateLabel, int AttendedCount);

public sealed record CommunityWebLinkDto(string Label, string Url);

public sealed record CommunityFactsDto(
    string AudienceLabel,
    string? CadenceLabel,
    string PlacesLabel,
    string? PlacesDetail,
    string? WebsiteLabel,
    string? WebsiteUrl,
    IReadOnlyList<CommunityWebLinkDto> Links,
    string PostingLeadLabel);

public sealed record OrganizerDto(string Name, string Initials, string RoleLabel, string? SpeakerSlug);

public sealed record CommunityDetailDto(
    string Slug,
    string Name,
    string Initials,
    string Tagline,
    IReadOnlyList<string> Topics,
    IReadOnlyList<string> About,
    IReadOnlyList<DayGroupDto> Upcoming,
    IReadOnlyList<PastEventDto> Past,
    CommunityFactsDto Facts,
    IReadOnlyList<OrganizerDto> Organizers);

/// <summary>A community's page (L2-031); 404 for an unknown slug.</summary>
public sealed record GetCommunityQuery(string Slug) : IRequest<CommunityDetailDto>;

/// <summary>
/// The community's profile, its upcoming published events by Toronto day and its three most recent past events
/// (view-community decisions). Organizers carry no email address (L2-099).
/// </summary>
public sealed class GetCommunityQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetCommunityQuery, CommunityDetailDto>
{
    public const int PastShown = 3;
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<CommunityDetailDto> Handle(GetCommunityQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var c = await db.Communities.AsNoTracking()
            .Include(x => x.Organizers).ThenInclude(o => o.Speaker)
            .Include(x => x.Organizers).ThenInclude(o => o.User)
            .SingleOrDefaultAsync(x => x.Slug == request.Slug, cancellationToken)
            ?? throw new NotFoundException("Community not found.");
        var events = await db.Events.AsNoTracking().Include(e => e.Community)
            .Where(e => e.CommunityId == c.Id && e.Status == EventStatus.Published)
            .ToListAsync(cancellationToken);
        var upcoming = events.Where(e => !e.IsPast(now) && !e.IsCancelled).OrderBy(e => e.StartsAtUtc).ToList();
        var past = events.Where(e => e.IsPast(now) && !e.IsCancelled)
            .OrderByDescending(e => e.StartsAtUtc)
            .Take(PastShown)
            .Select(e => new PastEventDto(
                e.Slug,
                e.Title,
                TorontoTime.ToLocal(e.StartsAtUtc).ToString("MMM d, yyyy", En),
                e.AttendedCount ?? e.GoingCount))
            .ToList();

        var streaming = string.Equals(c.City, "Streaming", StringComparison.OrdinalIgnoreCase);
        var cadence = c.Cadence is null ? null : c.ActiveSinceYear is { } since ? $"{c.Cadence} since {since}" : c.Cadence;
        var website = c.WebsiteUrl is { } url && Uri.TryCreate(url, UriKind.Absolute, out var uri) ? uri.Host.Replace("www.", string.Empty, StringComparison.Ordinal) : null;
        var facts = new CommunityFactsDto(
            $"{c.MemberCount.ToString("N0", En)} {(streaming ? "followers" : "members")}",
            cadence,
            c.PlacesLabel ?? c.City,
            c.PlacesDetail,
            website,
            c.WebsiteUrl,
            [.. c.Links.Select(l => new CommunityWebLinkDto(l.Label, l.Url))],
            $"{c.Name} usually posts its next {(streaming ? "stream" : "meetup")} {c.PostingLead ?? "a few weeks"} ahead.");
        var organizers = c.Organizers
            .OrderBy(o => o.SortOrder)
            .Select(o => new OrganizerDto(
                o.Speaker?.Name ?? o.User?.Name ?? "Organizer",
                o.Speaker?.Initials ?? Initials(o.User?.Name),
                o.Role,
                o.Speaker?.Slug))
            .ToList();
        var about = (c.About ?? c.Description).Split("\n\n", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return new CommunityDetailDto(
            c.Slug,
            c.Name,
            c.Initials,
            c.Tagline ?? c.Description,
            TopicKeys.Of(c.Topics),
            about,
            GetUpcomingEventsQueryHandler.GroupByDay(upcoming),
            past,
            facts,
            organizers);
    }

    private static string Initials(string? name) =>
        string.Concat((name ?? "?").Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => char.ToUpperInvariant(p[0])));
}
