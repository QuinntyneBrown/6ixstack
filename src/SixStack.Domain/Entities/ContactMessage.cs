namespace SixStack.Domain.Entities;

/// <summary>A message from the contact page (L2-073); kept for a year (L2-100).</summary>
public class ContactMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
