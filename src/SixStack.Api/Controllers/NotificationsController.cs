using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Notifications;

namespace SixStack.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(ISender sender) : ControllerBase
{
    /// <summary>The signed-in person's notifications, newest first (L2-065).</summary>
    [HttpGet]
    public Task<NotificationListDto> List(CancellationToken cancellationToken) => sender.Send(new GetNotificationsQuery(), cancellationToken);

    /// <summary>Marks one notification read; 404 when it is not yours.</summary>
    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new MarkNotificationReadCommand(id), cancellationToken);
        return NoContent();
    }

    /// <summary>Marks every notification read (L2-065 criterion 2).</summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        await sender.Send(new MarkAllNotificationsReadCommand(), cancellationToken);
        return NoContent();
    }
}
