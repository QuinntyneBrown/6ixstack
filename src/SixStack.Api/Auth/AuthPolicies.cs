namespace SixStack.Api.Auth;

public static class AuthPolicies
{
    public const string Organizer = "Organizer";
    public const string Moderator = "Moderator";

    /// <summary>Name of the session cookie (L2-083).</summary>
    public const string SessionCookie = "sixstack.session";
}
