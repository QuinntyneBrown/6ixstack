namespace SixStack.Api.Auth;

public static class AuthPolicies
{
    public const string Organizer = "Organizer";

    /// <summary>The edit page's endpoints: organizers and moderators (edit-event design).</summary>
    public const string EventEditor = "EventEditor";
    public const string Moderator = "Moderator";

    /// <summary>The admin API (event-admin-api design): the ApiToken bearer scheme only, and the moderator role (L2-121).</summary>
    public const string AdminApi = "AdminApi";

    /// <summary>Name of the session cookie (L2-083).</summary>
    public const string SessionCookie = "sixstack.session";
}
