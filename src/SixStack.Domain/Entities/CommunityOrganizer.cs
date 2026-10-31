namespace SixStack.Domain.Entities;

/// <summary>Membership of a user in the community whose events they manage.</summary>
public class CommunityOrganizer
{
    public Guid CommunityId { get; set; }
    public Community? Community { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Role { get; set; } = "Organizer";
}
