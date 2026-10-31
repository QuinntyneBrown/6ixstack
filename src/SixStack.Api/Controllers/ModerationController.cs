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
}
