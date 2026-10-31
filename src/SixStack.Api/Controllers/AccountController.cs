using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixStack.Application.Identity;

namespace SixStack.Api.Controllers;

[ApiController]
public sealed class AccountController(ISender sender) : ControllerBase
{
    /// <summary>The signed-in person's settings (L2-068 to L2-070).</summary>
    [HttpGet("api/account/settings")]
    [Authorize]
    public Task<AccountSettingsDto> Settings(CancellationToken cancellationToken) => sender.Send(new GetAccountSettingsQuery(), cancellationToken);

    /// <summary>Saves the settings; 400 with field errors.</summary>
    [HttpPut("api/account/settings")]
    [Authorize]
    public Task<SettingsSavedDto> Save(UpdateAccountSettingsCommand command, CancellationToken cancellationToken) => sender.Send(command, cancellationToken);

    /// <summary>Confirms a new email from its link and returns to settings with the outcome (L2-068).</summary>
    [HttpGet("auth/confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string? token, CancellationToken cancellationToken)
    {
        var confirmed = !string.IsNullOrWhiteSpace(token) && await sender.Send(new ConfirmEmailChangeCommand(token), cancellationToken);
        return Redirect(confirmed ? "/settings?email-confirmed=1" : "/settings?email-confirmed=0");
    }
}
