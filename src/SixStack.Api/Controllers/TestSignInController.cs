using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SixStack.Application.Identity;

namespace SixStack.Api.Controllers;

public sealed record TestSignInRequest(string Email);

/// <summary>
/// Test-only seam that signs in a seeded user without the magic-link flow, so integration tests and
/// Playwright can act as an organizer or moderator. It exists only when <c>Auth:TestSignIn:Enabled</c>
/// is true, which no production configuration sets.
/// </summary>
[ApiController]
[Route("api/test")]
[AllowAnonymous]
[IgnoreAntiforgeryToken]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class TestSignInController(ISender sender, Auth.SessionSignIn sessions) : ControllerBase
{
    [HttpPost("sign-in")]
    public async Task<IActionResult> SignIn(TestSignInRequest request, CancellationToken cancellationToken)
    {
        var signedIn = await sender.Send(new StartSessionCommand(request.Email), cancellationToken);
        if (signedIn is null)
        {
            return NotFound();
        }

        await sessions.SignInAsync(HttpContext, signedIn);
        return NoContent();
    }

    [HttpPost("sign-out")]
    public async Task<IActionResult> SignOutUser()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }
}
