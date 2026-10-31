namespace SixStack.Domain.Entities;

/// <summary>Membership of a user in the community whose events they manage.</summary>
public class CommunityOrganizer
{
    public Guid CommunityId { get; set; }
    public Community? Community { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Role { get; set; } = "Organizer";

    /// <summary>The organizer's speaker profile, which the community page links to.</summary>
    public Guid? SpeakerId { get; set; }

    public Speaker? Speaker { get; set; }

    /// <summary>Order on the community page, lead organizer first.</summary>
    public int SortOrder { get; set; }
}
