using System.Globalization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Api.Auth;
using SixStack.Application.EventAdmin;
using SixStack.Domain.Enums;

namespace SixStack.Api.Controllers;

/// <summary>
/// Event administration over HTTPS (event-admin-api design, ADR 0012): the CLI's <c>EventAdmin</c> requests behind a
/// moderator's API token. The controller parses HTTP input and maps results; business rules live in the handlers.
/// </summary>
[ApiController]
[Route("api/admin/events")]
[Authorize(Policy = AuthPolicies.AdminApi)]
public sealed class AdminEventsController(ISender sender) : ControllerBase
{
    /// <summary>Lists events (L2-115): every status but deleted unless <c>status</c> is given, ordered by start.</summary>
    [HttpGet]
    public async Task<ActionResult<AdminEventListDto>> List(
        [FromQuery] string? status,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] string? search,
        [FromQuery] int? take,
        CancellationToken cancellationToken)
    {
        EventStatus? parsedStatus = null;
        if (status is not null)
        {
            if (AdminEventStatus.ByName.TryGetValue(status, out var s))
            {
                parsedStatus = s;
            }
            else
            {
                ModelState.AddModelError("status", $"Use one of {string.Join(", ", AdminEventStatus.ByName.Keys)}.");
            }
        }

        var fromDate = Date(from, "from");
        var toDate = Date(to, "to");
        if (take is < 1 or > ListAdminEventsQuery.MaxTake)
        {
            ModelState.AddModelError("take", $"Use a whole number from 1 to {ListAdminEventsQuery.MaxTake}.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        return await sender.Send(new ListAdminEventsQuery(parsedStatus, fromDate, toDate, search, take ?? ListAdminEventsQuery.DefaultTake), cancellationToken);
    }

    /// <summary>Reads one event by id or slug, deleted or not (L2-115); its version is the ETag.</summary>
    [HttpGet("{idOrSlug}")]
    public async Task<ActionResult<AdminEventDto>> Get(string idOrSlug, [FromQuery] bool showContact, CancellationToken cancellationToken)
    {
        var e = await sender.Send(new GetAdminEventQuery(idOrSlug, showContact), cancellationToken);
        SetETag(e.Version);
        return e;
    }

    /// <summary>
    /// Adds an event, published at once (L2-116): 201 with its Location, or 200 with the preview for
    /// <c>?dryRun=true</c> (L2-119). Absent fields take the CLI's defaults.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AdminWriteResultDto>> Add([FromBody] EventDetailsPatch body, [FromQuery] bool dryRun, CancellationToken cancellationToken)
    {
        var result = await sender.Send(AddAdminEventCommand.From(body, apply: !dryRun), cancellationToken);
        return dryRun ? Ok(result) : Created($"/api/admin/events/{result.Event.Id}", result);
    }

    private DateOnly? Date(string? value, string parameter)
    {
        if (value is null)
        {
            return null;
        }

        if (DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return date;
        }

        ModelState.AddModelError(parameter, "Use a date like 2026-11-03.");
        return null;
    }

    private void SetETag(Guid version) => Response.Headers.ETag = $"\"{version}\"";
}
