using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Site;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/site")]
[AllowAnonymous]
public sealed class SiteController(ISender sender) : ControllerBase
{
    /// <summary>The current maintenance notice, or 204 when there is none.</summary>
    [HttpGet("notice")]
    [ProducesResponseType<MaintenanceNoticeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetNotice(CancellationToken cancellationToken)
    {
        var notice = await sender.Send(new GetSiteNoticeQuery(), cancellationToken);
        return notice is null ? NoContent() : Ok(notice);
    }
}
