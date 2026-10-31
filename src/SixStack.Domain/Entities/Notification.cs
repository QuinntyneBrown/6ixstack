namespace SixStack.Domain.Entities;

/// <summary>An in-app notification for a person, addressed by email so it reaches senders without an account yet (L2-066).</summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RecipientEmail { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Text { get; set; }
    public string? Link { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? ReadAtUtc { get; set; }
}
