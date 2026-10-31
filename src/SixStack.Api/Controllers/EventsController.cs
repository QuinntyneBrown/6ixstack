using Microsoft.AspNetCore.RateLimiting;
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

    /// <summary>This week's featured event (L2-006): 200 with its card, or 204 when nothing is featured.</summary>
    [HttpGet("featured")]
    public async Task<IActionResult> Featured(CancellationToken cancellationToken)
    {
        var featured = await sender.Send(new GetFeaturedEventQuery(), cancellationToken);
        return featured is null ? NoContent() : Ok(featured);
    }

    /// <summary>A visitor's problem report (L2-039, L2-040): 202, 400 with field errors, 404, or 429 after ten an hour.</summary>
    [HttpPost("{slug}/reports")]
    [EnableRateLimiting(Auth.SignInRateLimit.ReportPolicy)]
    public async Task<IActionResult> Report(string slug, ReportBody body, CancellationToken cancellationToken)
    {
        await sender.Send(new Application.Reports.ReportProblemCommand(slug, body.Reason, body.Details, body.ReplyEmail), cancellationToken);
        return Accepted();
    }

    /// <summary>The event map for the list's filters (L2-011, L2-013): venue dots, stream arcs and the 14 timeline days.</summary>
    [HttpGet("map")]
    public Task<EventMapDto> Map(
        [FromQuery] string? format,
        [FromQuery] string[]? topics,
        [FromQuery] string? q,
        CancellationToken cancellationToken = default) =>
        sender.Send(new GetEventMapQuery(format ?? "all", topics ?? [], q), cancellationToken);

    /// <summary>One Toronto month for the calendar grid (L2-025, L2-027); 400 for a malformed month.</summary>
    [HttpGet("calendar")]
    public Task<MonthCalendarDto> Calendar(
        [FromQuery] string? month,
        [FromQuery] string? format,
        [FromQuery] string[]? topics,
        CancellationToken cancellationToken = default) =>
        sender.Send(new GetMonthCalendarQuery(month, format ?? "all", topics ?? []), cancellationToken);

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

public sealed record ReportBody(string? Reason, string? Details, string? ReplyEmail);
