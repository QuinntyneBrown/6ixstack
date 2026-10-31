namespace SixStack.Domain.Entities;

/// <summary>An address that proved it receives mail, independent of any account (L2-085).</summary>
public class VerifiedEmail
{
    public string NormalizedEmail { get; set; } = string.Empty;
    public DateTimeOffset VerifiedAtUtc { get; set; }
}
