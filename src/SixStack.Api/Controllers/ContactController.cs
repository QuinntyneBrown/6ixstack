using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SixStack.Application.Site;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/contact")]
[AllowAnonymous]
public sealed class ContactController(ISender sender) : ControllerBase
{
    /// <summary>Sends a contact message (L2-073): 202, 400 with field errors, or 429 after five an hour.</summary>
    [HttpPost]
    [EnableRateLimiting(Auth.SignInRateLimit.ContactPolicy)]
    public async Task<IActionResult> Send(SendContactMessageCommand command, CancellationToken cancellationToken) =>
        Accepted(await sender.Send(command, cancellationToken));
}
