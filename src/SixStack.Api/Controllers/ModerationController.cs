using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Api.Auth;
using SixStack.Application.Moderation;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/moderation")]
[Authorize(Policy = AuthPolicies.Moderator)]
public sealed class ModerationController(ISender sender) : ControllerBase
{
    /// <summary>The review queue (L2-057, L2-058): 401 when anonymous, 403 for a non-moderator.</summary>
    [HttpGet("queue")]
    public Task<ReviewQueueDto> Queue(CancellationToken cancellationToken) => sender.Send(new GetReviewQueueQuery(), cancellationToken);

    /// <summary>Approves a submission (L2-060); 409 when someone already decided it (L2-063).</summary>
    [HttpPost("submissions/{id:guid}/approve")]
    public Task<ApprovalResultDto> Approve(Guid id, CancellationToken cancellationToken) =>
        sender.Send(new ApproveSubmissionCommand(id), cancellationToken);

    /// <summary>Rejects a submission with a reason (L2-061); 409 when someone already decided it (L2-063).</summary>
    [HttpPost("submissions/{id:guid}/reject")]
    public Task<RejectionResultDto> Reject(Guid id, RejectSubmissionRequest body, CancellationToken cancellationToken) =>
        sender.Send(new RejectSubmissionCommand(id, body.Reason, body.Message), cancellationToken);

    /// <summary>Undoes an approval within 8 s (L2-060); 409 afterwards.</summary>
    [HttpPost("submissions/{id:guid}/undo-approval")]
    public async Task<IActionResult> UndoApproval(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new UndoApprovalCommand(id), cancellationToken);
        return NoContent();
    }

    /// <summary>Records that the caller is looking at a submission; names the others who are (L2-063).</summary>
    [HttpPost("submissions/{id:guid}/presence")]
    public Task<ReviewPresenceDto> Presence(Guid id, CancellationToken cancellationToken) =>
        sender.Send(new RecordReviewPresenceCommand(id), cancellationToken);
}

public sealed record RejectSubmissionRequest(string? Reason, string? Message);
