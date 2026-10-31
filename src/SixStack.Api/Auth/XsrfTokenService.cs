using Microsoft.AspNetCore.Antiforgery;

namespace SixStack.Api.Auth;

/// <summary>
/// Issues the anti-forgery token when a session starts (L2-083). The <c>XSRF-TOKEN</c> cookie is readable by script
/// so Angular's HttpClient copies it into the <c>X-XSRF-TOKEN</c> header; visitors without a session get no cookie.
/// </summary>
public sealed class XsrfTokenService(IAntiforgery antiforgery)
{
    public const string CookieName = "XSRF-TOKEN";
    public const string HeaderName = "X-XSRF-TOKEN";

    /// <summary>Call after signing in, with <see cref="HttpContext.User"/> already set to the new principal.</summary>
    public void Issue(HttpContext context)
    {
        var tokens = antiforgery.GetAndStoreTokens(context);
        context.Response.Cookies.Append(CookieName, tokens.RequestToken!, new CookieOptions
        {
            Secure = true,
            HttpOnly = false,
            SameSite = SameSiteMode.Strict,
            Path = "/",
        });
    }
}
