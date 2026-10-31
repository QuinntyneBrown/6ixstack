using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

public class Community
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public Topics Topics { get; set; }
    public string? WebsiteUrl { get; set; }

    public List<CommunityOrganizer> Organizers { get; set; } = [];

    /// <summary>People following the community's events in a calendar feed; a stored figure until feed requests are counted.</summary>
    public int FeedSubscriberCount { get; set; }

    /// <summary>One line under the name on the community page; the description stands in when empty.</summary>
    public string? Tagline { get; set; }

    /// <summary>The About section, paragraphs separated by blank lines; the description stands in when empty.</summary>
    public string? About { get; set; }

    /// <summary>How often the group meets, such as "Monthly".</summary>
    public string? Cadence { get; set; }

    public int? ActiveSinceYear { get; set; }

    /// <summary>Where it meets, such as "Mississauga and online".</summary>
    public string? PlacesLabel { get; set; }

    /// <summary>Its usual venues, such as "Living Arts Centre, Sheridan College".</summary>
    public string? PlacesDetail { get; set; }

    /// <summary>How far ahead it usually posts, such as "about three weeks".</summary>
    public string? PostingLead { get; set; }

    public List<CommunityLink> Links { get; set; } = [];
}

/// <summary>A link on the community page, such as its Meetup group.</summary>
public class CommunityLink
{
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
