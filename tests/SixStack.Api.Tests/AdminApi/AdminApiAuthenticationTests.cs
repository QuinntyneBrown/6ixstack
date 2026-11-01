using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Auth;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Domain.Enums;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>L2-120 and L2-121: the admin API takes a moderator's active bearer token and nothing else.</summary>
public sealed class AdminApiAuthenticationTests(AdminApiAuthenticationTests.Factory factory) : IClassFixture<AdminApiAuthenticationTests.Factory>
{
    private const string Probe = "/api/admin/probe";

    // L2-121 #1: Given no Authorization header, a malformed token or an unknown token, then 401 with
    // WWW-Authenticate: Bearer and problem details.
    [Theory]
    [InlineData(null)]
    [InlineData("not-a-token")]
    [InlineData("sxk_00000000000000000000000000000000_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")]
    public async Task A_missing_or_unknown_token_is_401(string? token)
    {
        var client = token is null ? factory.CreateHttpsClient() : factory.CreateTokenClient(token);

        var response = await client.GetAsync(Probe);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Contains(response.Headers.WwwAuthenticate, h => h.Scheme == "Bearer");
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // L2-121 #1: Given a real token id with the wrong secret, then 401.
    [Fact]
    public async Task A_token_with_the_wrong_secret_is_401()
    {
        var (token, _) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator);
        var forged = token[..^4] + (token[^4..] == "AAAA" ? "BBBB" : "AAAA");

        var response = await factory.CreateTokenClient(forged).GetAsync(Probe);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // L2-120 #3: Given a moderator's active token, when it is used, then 200 and its last use time is set.
    [Fact]
    public async Task A_moderators_token_is_accepted_and_its_use_recorded()
    {
        var (token, id) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator);

        var response = await factory.CreateTokenClient(token).GetAsync(Probe);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(ApiFactory.Today, await factory.WithDbAsync(db => db.ApiTokens.Where(t => t.Id == id).Select(t => t.LastUsedAtUtc).SingleAsync()));
    }

    // L2-120 #4: Given a revoked or expired token, when it is used, then 401.
    [Fact]
    public async Task A_revoked_or_expired_token_is_401()
    {
        var (revoked, _) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator, t => t.RevokedAtUtc = ApiFactory.Today.AddHours(-1));
        var (expired, _) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator, t => t.ExpiresAtUtc = ApiFactory.Today.AddSeconds(-1));

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateTokenClient(revoked).GetAsync(Probe)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateTokenClient(expired).GetAsync(Probe)).StatusCode);
    }

    // L2-121 #2: Given an active token whose owner is now an organizer, then 403 problem details.
    [Fact]
    public async Task A_token_whose_owner_is_no_longer_a_moderator_is_403()
    {
        var (token, _) = await factory.IssueTokenAsync(HttpClientExtensions.SecondModerator);
        await factory.WithDbAsync(async db =>
        {
            var sam = await db.Users.SingleAsync(u => u.Email == HttpClientExtensions.SecondModerator);
            sam.Role = UserRole.Organizer;
            return await db.SaveChangesAsync();
        });

        var response = await factory.CreateTokenClient(token).GetAsync(Probe);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        await factory.WithDbAsync(async db =>
        {
            (await db.Users.SingleAsync(u => u.Email == HttpClientExtensions.SecondModerator)).Role = UserRole.Moderator;
            return await db.SaveChangesAsync();
        });
    }

    // L2-121 #3: Given a signed-in moderator's session cookie and no token, then 401.
    [Fact]
    public async Task A_session_cookie_does_not_reach_the_admin_api()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Moderator);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(Probe)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync(Probe, null)).StatusCode);
    }

    // L2-121 #4: Given a valid token, when a moderation or organizer endpoint is called with it, then 401.
    [Fact]
    public async Task A_token_does_not_reach_any_other_endpoint()
    {
        var (token, _) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator);
        var client = factory.CreateTokenClient(token);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/moderation/queue")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/organizer/events")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync($"/api/moderation/submissions/{Guid.NewGuid()}/approve", new { })).StatusCode);
    }

    // L2-121 #5: Given a valid token and no anti-forgery token, when a write is called, then it succeeds.
    [Fact]
    public async Task A_token_write_needs_no_anti_forgery_token()
    {
        var (token, _) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator);

        var response = await factory.CreateTokenClient(token).PostAsync(Probe, null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // L2-121: Given a token sent with another scheme, then it is not read, 401.
    [Fact]
    public async Task Only_the_bearer_scheme_is_read()
    {
        var (token, _) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator);
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(Probe)).StatusCode);
    }

    public sealed class Factory : ApiFactory
    {
        protected override void ConfigureTestServices(IServiceCollection services) =>
            services.AddControllers().AddApplicationPart(typeof(AdminApiProbeController).Assembly);
    }
}

[ApiController]
[Route("api/admin/probe")]
[Authorize(Policy = AuthPolicies.AdminApi)]
public sealed class AdminApiProbeController : ControllerBase
{
    [HttpGet]
    public IActionResult Read() => Ok();

    [HttpPost]
    public IActionResult Write() => Ok();
}
