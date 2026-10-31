using SixStack.Domain.Enums;

namespace SixStack.Application.Common;

/// <summary>URL and JSON keys for topics: ai, dotnet, azure, angular, react, aws.</summary>
public static class TopicKeys
{
    public static readonly IReadOnlyDictionary<string, Topics> ByKey = new Dictionary<string, Topics>(StringComparer.OrdinalIgnoreCase)
    {
        ["ai"] = Topics.AI,
        ["dotnet"] = Topics.DotNet,
        ["azure"] = Topics.Azure,
        ["angular"] = Topics.Angular,
        ["react"] = Topics.React,
        ["aws"] = Topics.Aws,
    };

    /// <summary>The keys of the topics set in <paramref name="topics"/>, in the fixed topic order.</summary>
    public static IReadOnlyList<string> Of(Topics topics) => [.. ByKey.Where(kv => topics.HasFlag(kv.Value)).Select(kv => kv.Key)];

    public static Topics Parse(IEnumerable<string> keys) => keys.Aggregate(Topics.None, (mask, key) => mask | ByKey[key]);
}
