using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Directory;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/speakers")]
[AllowAnonymous]
public sealed class SpeakersController(ISender sender) : ControllerBase
{
    /// <summary>The speakers directory (L2-032); 400 for an unknown topic or period.</summary>
    [HttpGet]
    public Task<SpeakerDirectoryDto> List(
        [FromQuery] string? q,
        [FromQuery] string? topic,
        [FromQuery] string? period,
        [FromQuery] int page = 1,
        CancellationToken cancellationToken = default) =>
        sender.Send(new GetSpeakersQuery(q, topic, period ?? "any", page), cancellationToken);
}
