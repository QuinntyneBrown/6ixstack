using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

public class Speaker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Affiliation { get; set; }
    public string? Bio { get; set; }
    public string? HomeCity { get; set; }
    public Topics Topics { get; set; }
    public string? PublicContactEmail { get; set; }

    /// <summary>The year they started speaking, for "Since 2019".</summary>
    public int? SpeakingSinceYear { get; set; }

    /// <summary>Talks given before 6ixstack recorded them; the page adds the talks it knows about.</summary>
    public int EarlierTalkCount { get; set; }

    /// <summary>A line under the home city, such as "Speaks in person across the GTA".</summary>
    public string? TravelNote { get; set; }

    public List<SpeakerLink> Links { get; set; } = [];
}

/// <summary>A public link on the speaker page, such as their site or GitHub.</summary>
public class SpeakerLink
{
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
