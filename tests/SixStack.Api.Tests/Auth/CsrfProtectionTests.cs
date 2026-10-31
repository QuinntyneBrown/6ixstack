using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Auth;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Auth;

/// <summary>L2-083: state-changing cookie-authenticated requests need the anti-forgery token.</summary>
public sealed class CsrfProtectionTests(CsrfProtectionTests.Factory factory) : IClassFixture<CsrfProtectionTests.Factory>
{
    [Fact]
    public async Task Signing_in_issues_a_script_readable_strict_xsrf_cookie()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync("/api/test/sign-in", new { email = HttpClientExtensions.Organizer });

        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal));
        Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("httponly", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Cookie_authenticated_write_without_the_token_is_rejected_before_the_action_runs()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Organizer);
        client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN"); // the sign-in helper echoes the token; this write has none
        CsrfProbeController.Calls = 0;

        var response = await client.PostAsync("/api/csrf-probe", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, CsrfProbeController.Calls);
    }

    [Fact]
    public async Task Cookie_authenticated_write_with_the_token_succeeds()
    {
        var client = factory.CreateHttpsClient();
        var signIn = await client.PostAsJsonAsync("/api/test/sign-in", new { email = HttpClientExtensions.Organizer });
        var token = signIn.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal)).Split(';')[0]["XSRF-TOKEN=".Length..];

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/csrf-probe");
        request.Headers.Add("X-XSRF-TOKEN", Uri.UnescapeDataString(token));
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_write_needs_no_token()
    {
        var response = await factory.CreateHttpsClient().PostAsync("/api/csrf-probe/public", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    public sealed class Factory : ApiFactory
    {
        protected override void ConfigureTestServices(IServiceCollection services) =>
            services.AddControllers().AddApplicationPart(typeof(CsrfProbeController).Assembly);
    }
}

[ApiController]
[Route("api/csrf-probe")]
public sealed class CsrfProbeController : ControllerBase
{
    public static int Calls;

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Organizer)]
    public IActionResult Write()
    {
        Calls++;
        return Ok();
    }

    [HttpPost("public")]
    [AllowAnonymous]
    public IActionResult PublicWrite() => Ok();
}
