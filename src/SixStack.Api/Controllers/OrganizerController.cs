using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Api.Auth;
using SixStack.Application.Identity;
using SixStack.Application.Organizer;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/organizer")]
[Authorize(Policy = AuthPolicies.Organizer)]
public sealed class OrganizerController(ISender sender) : ControllerBase
{
    /// <summary>The organizer dashboard (L2-051, L2-053): 401 anonymous, 403 for non-organizers.</summary>
    [HttpGet("events")]
    public Task<OrganizerDashboardDto> Dashboard(CancellationToken cancellationToken) => sender.Send(new GetOrganizerDashboardQuery(), cancellationToken);

    /// <summary>Sends a new verification link to the signed-in organizer (L2-053).</summary>
    [HttpPost("verification-email")]
    public async Task<IActionResult> ResendVerification(CancellationToken cancellationToken)
    {
        await sender.Send(new ResendVerificationCommand(), cancellationToken);
        return Accepted();
    }
}
