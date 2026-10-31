namespace SixStack.Application.Calendar;

/// <summary>Public site settings, from configuration section <c>Site</c>.</summary>
public sealed class SiteOptions
{
    public const string Section = "Site";

    /// <summary>The web app's public origin, used in calendar links and emails.</summary>
    public string PublicBaseUrl { get; set; } = "https://6ixstack.dev";
}
