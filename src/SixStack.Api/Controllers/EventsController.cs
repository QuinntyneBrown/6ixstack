using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using SixStack.Application.Calendar;
using SixStack.Application.Events;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/events")]
[AllowAnonymous]
public sealed class EventsController(ISender sender) : ControllerBase
{
    /// <summary>Upcoming published events grouped by Toronto day, with format and hero counts (L2-001 to L2-009).</summary>
    [HttpGet]
    public Task<UpcomingEventsDto> GetUpcoming(
        [FromQuery] string? format,
        [FromQuery] string[]? topics,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        CancellationToken cancellationToken = default) =>
        sender.Send(new GetUpcomingEventsQuery(format ?? "all", topics ?? [], q, page), cancellationToken);

    /// <summary>One published event with its facts, actions and alerts (L2-017 to L2-024); 404 when unknown or unpublished.</summary>
    [HttpGet("{slug}")]
    public Task<EventDetailDto> GetDetail(string slug, CancellationToken cancellationToken) =>
        sender.Send(new GetEventDetailQuery(slug), cancellationToken);

    /// <summary>The event as a single-event iCalendar file for Apple Calendar and other apps (L2-037).</summary>
    [HttpGet("{slug}/ics")]
    public async Task<IActionResult> GetIcs(string slug, CancellationToken cancellationToken)
    {
        var file = await sender.Send(new GetEventIcsQuery(slug), cancellationToken);
        return File(Encoding.UTF8.GetBytes(file.Content), "text/calendar; charset=utf-8", file.FileName);
    }
}
