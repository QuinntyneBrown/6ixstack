using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SixStack.Application.Calendar;
using SixStack.Application.Common;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Enums;
using SixStack.Domain.ValueObjects;

namespace SixStack.Application.Feeds;

public sealed record FeedLinkDto(
    string FeedSlug,
    string WebcalUrl,
    string GoogleCalendarUrl,
    string OutlookUrl,
    string AppleCalendarUrl,
    string Summary,
    int MatchingEventCount);

/// <summary>A custom feed choice (L2-035): topics or all topics, a scope, and optionally one community.</summary>
public sealed record CreateFeedCommand(IReadOnlyList<string>? Topics, bool AllTopics, string? Scope, string? CommunitySlug) : IRequest<FeedLinkDto>
{
    public static readonly Dictionary<string, FeedScope> Scopes = new()
    {
        ["all"] = FeedScope.All,
        ["gtaOnly"] = FeedScope.GtaOnly,
        ["streamingOnly"] = FeedScope.StreamingOnly,
    };
}

public sealed class CreateFeedCommandValidator : AbstractValidator<CreateFeedCommand>
{
    public CreateFeedCommandValidator(IAppDbContext db)
    {
        RuleFor(c => c.Topics)
            .Must((c, topics) => c.AllTopics || topics is { Count: > 0 })
            .WithMessage("Pick at least one topic, or choose “All topics”.");
        RuleForEach(c => c.Topics).Must(t => TopicKeys.ByKey.ContainsKey(t)).WithMessage("Unknown topic.");
        RuleFor(c => c.Scope).Must(s => s is not null && CreateFeedCommand.Scopes.ContainsKey(s)).WithMessage("Choose where the events are.");
        RuleFor(c => c.CommunitySlug)
            .MustAsync(async (slug, ct) => slug is null || await db.Communities.AnyAsync(x => x.Slug == slug, ct))
            .WithMessage("That community isn't on 6ixstack.");
    }
}

/// <summary>
/// Turns a choice into its canonical slug (equal choices, equal links), counts the upcoming events it holds, and
/// builds the subscribe links (build-custom-feed design).
/// </summary>
public sealed class CreateFeedCommandHandler(IAppDbContext db, IClock clock, IOptions<SiteOptions> site) : IRequestHandler<CreateFeedCommand, FeedLinkDto>
{
    public async Task<FeedLinkDto> Handle(CreateFeedCommand request, CancellationToken cancellationToken)
    {
        var topics = request.AllTopics ? Topics.None : TopicKeys.Parse(request.Topics ?? []);
        var slug = new FeedSlug(topics, CreateFeedCommand.Scopes[request.Scope!], request.CommunitySlug);
        var community = request.CommunitySlug is null
            ? null
            : await db.Communities.AsNoTracking().Where(c => c.Slug == request.CommunitySlug).Select(c => new { c.Id, c.Name }).SingleAsync(cancellationToken);
        var now = clock.UtcNow;
        var count = await FeedEventFilter.Apply(
                db.Events.AsNoTracking().Where(e => e.Status == EventStatus.Published && e.CancelledAtUtc == null && e.EndsAtUtc >= now),
                slug,
                community?.Id)
            .CountAsync(cancellationToken);
        return FeedLinkBuilder.Build(slug, community?.Name, site.Value.PublicBaseUrl, count);
    }
}

public static class FeedLinkBuilder
{
    public static FeedLinkDto Build(FeedSlug slug, string? communityName, string publicBaseUrl, int count)
    {
        var host = new Uri(publicBaseUrl).Authority;
        var webcal = $"webcal://{host}/feeds/{slug}.ics";
        var encoded = Uri.EscapeDataString(webcal);
        return new FeedLinkDto(
            slug.ToString(),
            webcal,
            $"https://calendar.google.com/calendar/r?cid={encoded}",
            $"https://outlook.live.com/calendar/addcalendar?url={encoded}",
            webcal,
            Summary(slug, communityName),
            count);
    }

    /// <summary>"AI and Azure events, in the GTA and streaming."</summary>
    public static string Summary(FeedSlug slug, string? communityName)
    {
        var labels = FeedSlug.TopicTokens.Where(t => slug.Topics.HasFlag(t.Flag)).Select(t => TopicKeys.Label(t.Key)).ToList();
        var what = communityName is not null && labels.Count == 0
            ? communityName
            : labels.Count switch
            {
                0 => "All",
                1 => labels[0],
                _ => $"{string.Join(", ", labels[..^1])} and {labels[^1]}",
            };
        var where = slug.Scope switch
        {
            FeedScope.GtaOnly => "in the GTA only",
            FeedScope.StreamingOnly => "streaming only",
            _ => "in the GTA and streaming",
        };
        return $"{what} events, {where}.";
    }
}
