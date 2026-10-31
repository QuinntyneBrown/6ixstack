using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Sharing;

namespace SixStack.Api.Controllers;

[ApiController]
[AllowAnonymous]
public sealed class ShortLinksController(ISender sender) : ControllerBase
{
    /// <summary>An event's short link (L2-038): 301 to its page, 404 when unknown or unpublished.</summary>
    [HttpGet("e/{slug}")]
    public async Task<IActionResult> Resolve(string slug, CancellationToken cancellationToken) =>
        await sender.Send(new ResolveShortLinkQuery(slug), cancellationToken) is { } path ? RedirectPermanent(path) : NotFound();
}
