using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using SixStack.Application.Identity;

namespace SixStack.Api.Auth;

/// <summary>
/// Treats a cookie as signed in only while its server-side session is active: not revoked and used within 14 days
/// (L2-048, ADR 0009). Otherwise the request continues anonymously and the cookie is cleared.
/// </summary>
public static class SessionValidator
{
    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        var sid = context.Principal?.FindFirst(SessionSignIn.SessionIdClaim)?.Value;
        var sender = context.HttpContext.RequestServices.GetRequiredService<ISender>();
        if (!Guid.TryParse(sid, out var sessionId) || !await sender.Send(new TouchSessionCommand(sessionId), context.HttpContext.RequestAborted))
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }
}
