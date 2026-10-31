namespace SixStack.Application.Site;

/// <summary>The announced maintenance window, from configuration section <c>Maintenance</c>.</summary>
public sealed class MaintenanceOptions
{
    public const string Section = "Maintenance";

    public string? WindowId { get; set; }
    public DateTimeOffset? StartsAtUtc { get; set; }
    public DateTimeOffset? EndsAtUtc { get; set; }
    public string? Title { get; set; }
    public string? Text { get; set; }
}
