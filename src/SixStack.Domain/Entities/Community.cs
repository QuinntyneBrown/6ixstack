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
}
