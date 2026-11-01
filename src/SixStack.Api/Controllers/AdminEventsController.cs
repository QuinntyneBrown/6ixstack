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
[AdminBodyLimit]
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

    /// <summary>
    /// Applies the fields present in the body over the event's current details through the moderator edit path
    /// (L2-117). An applied update needs <c>If-Match</c> with the event's version; a dry run does not (L2-119).
    /// </summary>
    [HttpPatch("{idOrSlug}")]
    public async Task<ActionResult<AdminWriteResultDto>> Update(string idOrSlug, [FromBody] EventDetailsPatch body, [FromQuery] bool dryRun, CancellationToken cancellationToken)
    {
        if (ReadIfMatch(required: !dryRun, out var version) is { } problem)
        {
            return problem;
        }

        var result = await sender.Send(new UpdateAdminEventCommand(idOrSlug, body, version, Apply: !dryRun), cancellationToken);
        SetETag(result.Event.Version);
        return result;
    }

    /// <summary>
    /// Soft-deletes the event (L2-118): its status becomes deleted and the row and its history stay. An applied delete
    /// needs <c>If-Match</c> with the event's version; a dry run does not (L2-119).
    /// </summary>
    [HttpDelete("{idOrSlug}")]
    public async Task<ActionResult<AdminWriteResultDto>> Delete(string idOrSlug, [FromQuery] bool dryRun, CancellationToken cancellationToken)
    {
        if (ReadIfMatch(required: !dryRun, out var version) is { } problem)
        {
            return problem;
        }

        return await sender.Send(new DeleteAdminEventCommand(idOrSlug, version, Apply: !dryRun), cancellationToken);
    }

    /// <summary>
    /// Reads <c>If-Match: "&lt;version&gt;"</c> (quotes and <c>W/</c> optional). Returns a 428 problem when it is
    /// required and absent, and a 400 problem when it is not a version.
    /// </summary>
    private ActionResult? ReadIfMatch(bool required, out Guid? version)
    {
        version = null;
        var header = Request.Headers.IfMatch.ToString().Trim();
        if (header.Length == 0)
        {
            return required
                ? Problem(statusCode: StatusCodes.Status428PreconditionRequired, title: "Send If-Match with the event's version, as its ETag gives it.")
                : null;
        }

        var value = header.StartsWith("W/", StringComparison.Ordinal) ? header[2..] : header;
        if (!Guid.TryParse(value.Trim('"'), out var parsed))
        {
            ModelState.AddModelError("If-Match", "Use the event's version, as its ETag gives it.");
            return ValidationProblem(ModelState);
        }

        version = parsed;
        return null;
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
