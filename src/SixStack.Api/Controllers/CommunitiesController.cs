using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Directory;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/communities")]
[AllowAnonymous]
public sealed class CommunitiesController(ISender sender) : ControllerBase
{
    /// <summary>The communities directory (L2-029); 400 for an unknown topic or sort.</summary>
    [HttpGet]
    public Task<CommunityDirectoryDto> List(
        [FromQuery] string? q,
        [FromQuery] string? topic,
        [FromQuery] string? city,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        CancellationToken cancellationToken = default) =>
        sender.Send(new GetCommunitiesQuery(q, topic, city, sort ?? "members", page), cancellationToken);
}
