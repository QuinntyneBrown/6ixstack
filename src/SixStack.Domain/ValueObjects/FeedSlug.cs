using SixStack.Domain.Enums;

namespace SixStack.Domain.ValueObjects;

public enum FeedScope
{
    All = 0,
    GtaOnly = 1,
    StreamingOnly = 2,
}

/// <summary>
/// A feed's choice of topics, scope and optional community, in canonical text form: topic keys (or <c>all</c>), then
/// <c>gta-stream</c>, <c>gta</c> or <c>stream</c>, then an optional <c>-in-{community}</c>. Equal choices give equal
/// slugs, so equal links (build-custom-feed design).
/// </summary>
public sealed record FeedSlug(Topics Topics, FeedScope Scope, string? CommunitySlug)
{
    /// <summary>Topic keys in the fixed display order.</summary>
    public static readonly (string Key, Topics Flag)[] TopicTokens =
    [
        ("ai", Topics.AI), ("dotnet", Topics.DotNet), ("azure", Topics.Azure),
        ("angular", Topics.Angular), ("react", Topics.React), ("aws", Topics.Aws),
    ];

    public override string ToString()
    {
        var topics = Topics == Topics.None ? "all" : string.Join('-', TopicTokens.Where(t => Topics.HasFlag(t.Flag)).Select(t => t.Key));
        var scope = Scope switch { FeedScope.GtaOnly => "gta", FeedScope.StreamingOnly => "stream", _ => "gta-stream" };
        return CommunitySlug is null ? $"{topics}-{scope}" : $"{topics}-{scope}-in-{CommunitySlug}";
    }

    public static bool TryParse(string? text, out FeedSlug slug)
    {
        slug = null!;
        if (string.IsNullOrWhiteSpace(text) || text != text.ToLowerInvariant())
        {
            return false;
        }

        string? community = null;
        var choice = text;
        var marker = text.IndexOf("-in-", StringComparison.Ordinal);
        if (marker >= 0)
        {
            choice = text[..marker];
            community = text[(marker + 4)..];
            if (community.Length == 0)
            {
                return false;
            }
        }

        FeedScope scope;
        string topicPart;
        if (choice.EndsWith("-gta-stream", StringComparison.Ordinal))
        {
            (scope, topicPart) = (FeedScope.All, choice[..^"-gta-stream".Length]);
        }
        else if (choice.EndsWith("-gta", StringComparison.Ordinal))
        {
            (scope, topicPart) = (FeedScope.GtaOnly, choice[..^"-gta".Length]);
        }
        else if (choice.EndsWith("-stream", StringComparison.Ordinal))
        {
            (scope, topicPart) = (FeedScope.StreamingOnly, choice[..^"-stream".Length]);
        }
        else
        {
            return false;
        }

        var topics = Topics.None;
        if (topicPart != "all")
        {
            foreach (var token in topicPart.Split('-'))
            {
                var match = TopicTokens.FirstOrDefault(t => t.Key == token);
                if (match.Key is null || topics.HasFlag(match.Flag))
                {
                    return false;
                }

                topics |= match.Flag;
            }
        }

        slug = new FeedSlug(topics, scope, community);
        // Only the canonical spelling is a feed, so one choice never has two links.
        return slug.ToString() == text;
    }
}
