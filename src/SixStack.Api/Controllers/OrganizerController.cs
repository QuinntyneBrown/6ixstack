using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Api.Auth;
using SixStack.Application.Identity;
using SixStack.Application.Organizer;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/organizer")]
public sealed class OrganizerController(ISender sender) : ControllerBase
{
    /// <summary>The organizer dashboard (L2-051, L2-053): 401 anonymous, 403 for non-organizers.</summary>
    [HttpGet("events")]
    [Authorize(Policy = AuthPolicies.Organizer)]
    public Task<OrganizerDashboardDto> Dashboard(CancellationToken cancellationToken) => sender.Send(new GetOrganizerDashboardQuery(), cancellationToken);

    /// <summary>An event for the edit page (L2-054, L2-055): 403 names the owning community.</summary>
    [HttpGet("events/{id:guid}")]
    [Authorize(Policy = AuthPolicies.EventEditor)]
    public Task<EventEditDto> GetEvent(Guid id, CancellationToken cancellationToken) => sender.Send(new GetOrganizerEventQuery(id), cancellationToken);

    /// <summary>Saves the edit page (L2-054, L2-062): 400 with field errors, 403, or 409 when read-only or changed meanwhile.</summary>
    [HttpPut("events/{id:guid}")]
    [Authorize(Policy = AuthPolicies.EventEditor)]
    public Task<EventSavedDto> UpdateEvent(Guid id, UpdateOrganizerEventCommand command, CancellationToken cancellationToken) =>
        sender.Send(command with { Id = id }, cancellationToken);

    /// <summary>Cancels an event (L2-056): 400 without a reason or the typed name, 403, or 409 when past or cancelled.</summary>
    [HttpPost("events/{id:guid}/cancel")]
    [Authorize(Policy = AuthPolicies.EventEditor)]
    public Task<EventCancelledDto> CancelEvent(Guid id, CancelOrganizerEventCommand command, CancellationToken cancellationToken) =>
        sender.Send(command with { Id = id }, cancellationToken);

    /// <summary>Sends a new verification link to the signed-in organizer (L2-053).</summary>
    [HttpPost("verification-email")]
    [Authorize(Policy = AuthPolicies.Organizer)]
    public async Task<IActionResult> ResendVerification(CancellationToken cancellationToken)
    {
        await sender.Send(new ResendVerificationCommand(), cancellationToken);
        return Accepted();
    }
}
