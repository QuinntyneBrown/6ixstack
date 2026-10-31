using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Feeds;

namespace SixStack.Api.Controllers;

[ApiController]
[AllowAnonymous]
public sealed class FeedsController(ISender sender) : ControllerBase
{
    /// <summary>The ready-made feeds with their upcoming counts (L2-034).</summary>
    [HttpGet("api/feeds")]
    public Task<ReadyMadeFeedsDto> ReadyMade(CancellationToken cancellationToken) => sender.Send(new GetReadyMadeFeedsQuery(), cancellationToken);

    /// <summary>A calendar feed as iCalendar text (L2-036): 304 for a matching ETag, 404 for an unknown feed.</summary>
    [HttpGet("feeds/{slug}.ics")]
    public async Task<IActionResult> Feed(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCalendarFeedQuery(slug, Request.Headers.IfNoneMatch.ToString() is { Length: > 0 } tag ? tag : null), cancellationToken);
        if (!result.Found)
        {
            return NotFound();
        }

        Response.Headers.ETag = result.ETag;
        Response.Headers.CacheControl = "public, max-age=900";
        return result.NotModified
            ? StatusCode(StatusCodes.Status304NotModified)
            : File(Encoding.UTF8.GetBytes(result.Content!), "text/calendar; charset=utf-8");
    }
}
