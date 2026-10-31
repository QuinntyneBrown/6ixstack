using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;

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
public sealed class TestSignInController(IAppDbContext db, Auth.XsrfTokenService xsrf) : ControllerBase
{
    [HttpPost("sign-in")]
    public async Task<IActionResult> SignIn(TestSignInRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name ?? user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        HttpContext.User = principal;
        xsrf.Issue(HttpContext);
        return NoContent();
    }

    [HttpPost("sign-out")]
    public async Task<IActionResult> SignOutUser()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }
}
