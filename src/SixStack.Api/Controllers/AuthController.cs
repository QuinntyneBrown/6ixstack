using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Identity;

namespace SixStack.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    /// <summary>Redeems an email verification link and returns to the events page with the outcome (L2-085).</summary>
    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string? token, CancellationToken cancellationToken)
    {
        var verified = !string.IsNullOrWhiteSpace(token) && await sender.Send(new VerifyEmailCommand(token), cancellationToken);
        return Redirect(verified ? "/?email-verified=1" : "/?email-verified=0");
    }
}
