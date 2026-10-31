using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Common.Exceptions;

namespace SixStack.Api.Tests.Platform;

/// <summary>Test-only endpoints that fail in each way the API maps to problem details.</summary>
[ApiController]
[AllowAnonymous]
[Route("api/test-probe")]
public sealed class ProbeController : ControllerBase
{
    public const string SecretMessage = "Secret connection string Server=db01;Password=hunter2";

    [HttpGet("ok/{id}")]
    public IActionResult Ok(int id) => Ok(new { id });

    [HttpGet("boom")]
    public IActionResult Boom() => throw new InvalidOperationException(SecretMessage);

    [HttpGet("missing")]
    public IActionResult Missing() => throw new NotFoundException("Event 42 was not found");

    [HttpGet("forbidden")]
    public IActionResult Forbidden()
    {
        var ex = new ForbiddenAccessException();
        ex.Extensions["ownerName"] = "Toronto .NET User Group";
        ex.Extensions["resourceTitle"] = "What's new in the .NET 11 previews";
        throw ex;
    }

    [HttpGet("invalid")]
    public IActionResult Invalid() => throw new ValidationException([new ValidationFailure("Title", "Enter a title.")]);

    [HttpGet("limited")]
    public IActionResult Limited() => throw new RateLimitExceededException(TimeSpan.FromSeconds(90));
}
