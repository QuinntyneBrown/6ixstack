using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.ReferenceData;
using SixStack.Application.Submissions;

namespace SixStack.Api.Controllers;

[ApiController]
[AllowAnonymous]
public sealed class SubmissionsController(ISender sender) : ControllerBase
{
    /// <summary>Submits an event for review (L2-041 to L2-043); 400 with field errors, 429 past 10 a day per email.</summary>
    [HttpPost("api/submissions")]
    public Task<SubmissionReceivedDto> Submit(SubmitEventCommand command, CancellationToken cancellationToken) =>
        sender.Send(command, cancellationToken);

    /// <summary>Topics, cities and time zones for the submit and edit forms.</summary>
    [HttpGet("api/reference-data")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    public Task<ReferenceDataDto> ReferenceData(CancellationToken cancellationToken) =>
        sender.Send(new GetReferenceDataQuery(), cancellationToken);
}
