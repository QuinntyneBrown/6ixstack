using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using SixStack.Application.Identity;

namespace SixStack.Api.Auth;

/// <summary>Writes the session cookie for a started session (ADR 0009) and issues the XSRF token.</summary>
public sealed class SessionSignIn(XsrfTokenService xsrf)
{
    public const string SessionIdClaim = "sid";

    public async Task SignInAsync(HttpContext context, SignedIn signedIn)
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, signedIn.UserId.ToString()),
                new Claim(ClaimTypes.Email, signedIn.Email),
                new Claim(ClaimTypes.Name, signedIn.Name),
                new Claim(ClaimTypes.Role, signedIn.Role.ToString()),
                new Claim(SessionIdClaim, signedIn.SessionId.ToString()),
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        context.User = principal;
        xsrf.Issue(context);
    }
}
