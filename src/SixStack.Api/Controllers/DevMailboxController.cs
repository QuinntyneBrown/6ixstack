using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Controllers;

public sealed record DevMailboxMessageDto(string To, string Subject, string TextBody, DateTimeOffset ReceivedAtUtc);

/// <summary>
/// Development-only view of the dev mailbox, so tests and demos can follow emailed links. It exists only when
/// <c>DevMailbox:Expose</c> is true, which no production configuration sets.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/dev/mailbox")]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class DevMailboxController(DevMailbox mailbox) : ControllerBase
{
    [HttpGet]
    public IEnumerable<DevMailboxMessageDto> List([FromQuery] string? to) =>
        (string.IsNullOrWhiteSpace(to) ? mailbox.All() : mailbox.For(to))
            .Reverse()
            .Select(e => new DevMailboxMessageDto(e.Message.To, e.Message.Subject, e.Message.TextBody, e.ReceivedAtUtc));
}
