using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Auth;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Auth;

/// <summary>L2-080: organizer endpoints need an organizer session, moderation endpoints the moderator role.</summary>
public sealed class AuthorizationPolicyTests(AuthorizationPolicyTests.Factory factory) : IClassFixture<AuthorizationPolicyTests.Factory>
{
    [Fact]
    public async Task Anonymous_caller_gets_401_from_an_organizer_endpoint()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/probe/organizer");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Organizer_reaches_organizer_endpoint_but_gets_403_from_moderation()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Organizer);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/probe/organizer")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/probe/moderator")).StatusCode);
    }

    [Fact]
    public async Task Moderator_reaches_moderation_endpoint()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Moderator);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/probe/moderator")).StatusCode);
    }

    [Fact]
    public async Task Endpoint_without_an_attribute_is_closed_to_anonymous_callers()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/probe/unmarked");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Session_cookie_is_secure_httponly_and_lax()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsync("/api/test/sign-in", JsonContent.Create(new { email = HttpClientExtensions.Organizer }));

        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith(AuthPolicies.SessionCookie, StringComparison.Ordinal));
        Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", cookie, StringComparison.OrdinalIgnoreCase);
    }

    public sealed class Factory : ApiFactory
    {
        protected override void ConfigureTestServices(IServiceCollection services) =>
            services.AddControllers().AddApplicationPart(typeof(PolicyProbeController).Assembly);
    }
}

[ApiController]
[Route("api/probe")]
public sealed class PolicyProbeController : ControllerBase
{
    [HttpGet("organizer")]
    [Authorize(Policy = AuthPolicies.Organizer)]
    public IActionResult OrganizerOnly() => Ok();

    [HttpGet("moderator")]
    [Authorize(Policy = AuthPolicies.Moderator)]
    public IActionResult ModeratorOnly() => Ok();

    [HttpGet("unmarked")]
    public IActionResult Unmarked() => Ok();
}
