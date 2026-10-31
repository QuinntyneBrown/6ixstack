using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SixStack.Api.Auth;
using SixStack.Application.Identity;

namespace SixStack.Api.Controllers;

[ApiController]
public sealed class AuthController(ISender sender, SessionSignIn sessions) : ControllerBase
{
    /// <summary>Emails a single-use sign-in link (L2-046); always 202, whether or not the account exists.</summary>
    [HttpPost("api/auth/sign-in-links")]
    [AllowAnonymous]
    [EnableRateLimiting(SignInRateLimit.Policy)]
    public async Task<IActionResult> RequestSignInLink(RequestSignInLinkCommand command, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return Accepted();
    }

    /// <summary>Opens a sign-in link from the email: starts a session and redirects (L2-047).</summary>
    [HttpGet("auth/redeem")]
    [AllowAnonymous]
    public async Task<IActionResult> Redeem([FromQuery] string? token, CancellationToken cancellationToken)
    {
        var signedIn = string.IsNullOrWhiteSpace(token) ? null : await sender.Send(new RedeemSignInLinkCommand(token), cancellationToken);
        if (signedIn is null)
        {
            return Redirect("/sign-in?link=expired");
        }

        await sessions.SignInAsync(HttpContext, signedIn);
        return Redirect(signedIn.RedirectTo);
    }

    /// <summary>The signed-in user for the header (L2-050); 401 when anonymous.</summary>
    [HttpGet("api/auth/me")]
    [Authorize]
    public async Task<ActionResult<CurrentUserDto>> Me(CancellationToken cancellationToken) =>
        await sender.Send(new GetCurrentUserQuery(), cancellationToken) is { } user ? user : Unauthorized();

    /// <summary>Redeems an email verification link and returns to the events page with the outcome (L2-085).</summary>
    [HttpGet("auth/verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromQuery] string? token, CancellationToken cancellationToken)
    {
        var verified = !string.IsNullOrWhiteSpace(token) && await sender.Send(new VerifyEmailCommand(token), cancellationToken);
        return Redirect(verified ? "/?email-verified=1" : "/?email-verified=0");
    }
}
