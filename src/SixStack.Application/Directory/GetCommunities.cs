using System.Globalization;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;
using SixStack.Domain.Enums;

namespace SixStack.Application.Directory;

/// <summary>The communities directory (L2-029): search, topic, city, sort (`members`, `next`, `name`) and page.</summary>
public sealed record GetCommunitiesQuery(string? Search = null, string? Topic = null, string? City = null, string Sort = "members", int Page = 1)
    : IRequest<CommunityDirectoryDto>
{
    public const int FirstPageSize = 10;
    public const int PageSize = 20;
    public static readonly string[] Sorts = ["members", "next", "name"];
}

public sealed record NextEventDto(string Slug, string Title, string DateLabel);

public sealed record CommunityCardDto(
    string Slug,
    string Name,
    string Initials,
    string City,
    int MemberCount,
    string AudienceLabel,
    string Description,
    IReadOnlyList<string> Topics,
    NextEventDto? NextEvent);

public sealed record CommunityDirectoryDto(int ListedTotal, int MatchCount, IReadOnlyList<CommunityCardDto> Items, bool HasMore);

public sealed class GetCommunitiesQueryValidator : AbstractValidator<GetCommunitiesQuery>
{
    public GetCommunitiesQueryValidator()
    {
        RuleFor(q => q.Topic).Must(t => t is null || TopicKeys.ByKey.ContainsKey(t)).WithMessage("Unknown topic.");
        RuleFor(q => q.Sort).Must(s => GetCommunitiesQuery.Sorts.Contains(s)).WithMessage("Choose members, next or name.");
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
    }
}

/// <summary>
/// Lists communities with at least one published event (directory decisions): matches on name or topic name, the
/// topic and the city, sorted with ties broken by name; 10 on the first page, 20 on each after.
/// </summary>
public sealed class GetCommunitiesQueryHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetCommunitiesQuery, CommunityDirectoryDto>
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public async Task<CommunityDirectoryDto> Handle(GetCommunitiesQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var listed = await db.Communities.AsNoTracking()
            .Where(c => db.Events.Any(e => e.CommunityId == c.Id && e.Status == EventStatus.Published))
            .ToListAsync(cancellationToken);
        var nextEvents = (await db.Events.AsNoTracking()
                .Where(e => e.CommunityId != null && e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.StartsAtUtc >= now)
                .Select(e => new { e.CommunityId, e.Slug, e.Title, e.StartsAtUtc })
                .ToListAsync(cancellationToken))
            .GroupBy(e => e.CommunityId!.Value)
            .ToDictionary(g => g.Key, g => g.OrderBy(e => e.StartsAtUtc).First());

        var search = (request.Search ?? string.Empty).Trim();
        if (search.Length > 100)
        {
            search = search[..100];
        }

        var matches = listed.Where(c =>
            (search.Length == 0
                || c.Name.Contains(search, StringComparison.OrdinalIgnoreCase)
                || TopicKeys.Of(c.Topics).Any(t => TopicKeys.Label(t).Contains(search, StringComparison.OrdinalIgnoreCase)))
            && (request.Topic is null || c.Topics.HasFlag(TopicKeys.ByKey[request.Topic]))
            && (request.City is null || string.Equals(c.City, request.City, StringComparison.OrdinalIgnoreCase)));
        matches = request.Sort switch
        {
            "next" => matches.OrderBy(c => nextEvents.TryGetValue(c.Id, out var n) ? n.StartsAtUtc : DateTimeOffset.MaxValue)
                .ThenBy(c => c.Name, StringComparer.OrdinalIgnoreCase),
            "name" => matches.OrderBy(c => c.Name, StringComparer.OrdinalIgnoreCase),
            _ => matches.OrderByDescending(c => c.MemberCount).ThenBy(c => c.Name, StringComparer.OrdinalIgnoreCase),
        };
        var all = matches.ToList();
        var skip = request.Page == 1 ? 0 : GetCommunitiesQuery.FirstPageSize + ((request.Page - 2) * GetCommunitiesQuery.PageSize);
        var take = request.Page == 1 ? GetCommunitiesQuery.FirstPageSize : GetCommunitiesQuery.PageSize;
        var items = all.Skip(skip).Take(take).Select(c =>
        {
            var streaming = string.Equals(c.City, "Streaming", StringComparison.OrdinalIgnoreCase);
            var next = nextEvents.TryGetValue(c.Id, out var n)
                ? new NextEventDto(n.Slug, n.Title, TorontoTime.ToLocal(n.StartsAtUtc).ToString("ddd, MMM d", En))
                : null;
            return new CommunityCardDto(
                c.Slug,
                c.Name,
                c.Initials,
                c.City,
                c.MemberCount,
                $"{c.MemberCount.ToString("N0", En)} {(streaming ? "followers" : "members")}",
                c.Description,
                TopicKeys.Of(c.Topics),
                next);
        }).ToList();
        return new CommunityDirectoryDto(listed.Count, all.Count, items, skip + items.Count < all.Count);
    }
}
