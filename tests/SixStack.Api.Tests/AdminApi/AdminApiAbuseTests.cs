using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>L2-123: rate limits, body size, problem details without secrets, and the Swagger security scheme.</summary>
public sealed class AdminApiAbuseTests
{
    // L2-123 #1: Given the per-token limit is reached, then the next request with that token is 429 with Retry-After
    // and problem details, while another token from the same address still gets through.
    [Fact]
    public async Task Requests_beyond_the_per_token_limit_are_429()
    {
        using var factory = new LimitedFactory(perToken: 3, perIp: 100);
        var first = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);
        var second = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.SecondModerator)).Token);
        for (var i = 0; i < 3; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await first.GetAsync("/api/admin/events?take=1")).StatusCode);
        }

        var limited = await first.GetAsync("/api/admin/events?take=1");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.NotNull(limited.Headers.RetryAfter);
        Assert.Equal("application/problem+json", limited.Content.Headers.ContentType?.MediaType);
        Assert.Equal(429, (await Json(limited)).GetProperty("status").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await second.GetAsync("/api/admin/events?take=1")).StatusCode);
    }

    // L2-123 #2: Given the per-IP limit is reached, then the next request from that address is 429, whatever token
    // it carries, and anonymous attempts count too.
    [Fact]
    public async Task Requests_beyond_the_per_ip_limit_are_429()
    {
        using var factory = new LimitedFactory(perToken: 100, perIp: 3);
        var first = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);
        var second = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.SecondModerator)).Token);

        Assert.Equal(HttpStatusCode.OK, (await first.GetAsync("/api/admin/events?take=1")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await second.GetAsync("/api/admin/events?take=1")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/admin/events")).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, (await second.GetAsync("/api/admin/events?take=1")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await factory.CreateHttpsClient().GetAsync("/api/events")).StatusCode);
    }

    // L2-123 #3: Given a body over 64 KB, then 413 problem details and nothing is stored.
    [Fact]
    public async Task A_body_over_64_kb_is_413()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateTokenClient((await factory.IssueTokenAsync(HttpClientExtensions.Moderator)).Token);
        var before = await factory.WithDbAsync(db => db.Events.CountAsync());
        var body = new StringContent($$"""{ "title": "Huge", "description": "{{new string('x', 70 * 1024)}}" }""", Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/admin/events", body);

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(before, await factory.WithDbAsync(db => db.Events.CountAsync()));
    }

    // L2-123 #5: Given 401, 403, 404, 409 and 429 responses, then each is problem details holding neither the token
    // nor its hash.
    [Fact]
    public async Task Error_responses_are_problem_details_without_secrets()
    {
        using var factory = new LimitedFactory(perToken: 6, perIp: 100);
        var (token, id) = await factory.IssueTokenAsync(HttpClientExtensions.Moderator);
        var (organizerToken, _) = await factory.IssueTokenAsync(HttpClientExtensions.Organizer);
        var hashes = await factory.WithDbAsync(db => db.ApiTokens.Select(t => t.TokenHash + " " + t.Salt).ToListAsync());
        var client = factory.CreateTokenClient(token);
        var stale = new HttpRequestMessage(HttpMethod.Delete, "/api/admin/events/whats-new-in-dotnet-11-previews");
        stale.Headers.TryAddWithoutValidation("If-Match", $"\"{Guid.NewGuid()}\"");
        var forged = token[..^3] + (token.EndsWith("abc", StringComparison.Ordinal) ? "xyz" : "abc");

        var responses = new List<HttpResponseMessage>
        {
            await factory.CreateTokenClient(forged).GetAsync("/api/admin/events"),
            await factory.CreateTokenClient(organizerToken).GetAsync("/api/admin/events"),
            await client.GetAsync("/api/admin/events/no-such-event"),
            await client.SendAsync(stale),
        };
        while (responses[^1].StatusCode != HttpStatusCode.TooManyRequests && responses.Count < 20)
        {
            responses.Add(await client.GetAsync("/api/admin/events?take=1"));
        }

        Assert.Equal(
            [HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.NotFound, HttpStatusCode.Conflict, HttpStatusCode.TooManyRequests],
            responses.Where(r => !r.IsSuccessStatusCode).Select(r => r.StatusCode));
        foreach (var response in responses.Where(r => !r.IsSuccessStatusCode))
        {
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
            var body = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain(token[^20..], body);
            Assert.DoesNotContain(id.ToString("N"), body);
            Assert.All(hashes, h => Assert.DoesNotContain(h.Split(' ')[0], body));
            Assert.All(hashes, h => Assert.DoesNotContain(h.Split(' ')[1], body));
        }
    }

    // L2-123 #6: Given the Swagger document, then the admin endpoints declare the bearer scheme and others do not.
    [Fact]
    public async Task Swagger_declares_the_bearer_scheme_on_admin_endpoints()
    {
        using var factory = new ApiFactory();

        var doc = await Json(await factory.CreateHttpsClient().GetAsync("/swagger/v1/swagger.json"));

        var scheme = doc.GetProperty("components").GetProperty("securitySchemes").GetProperty("Bearer");
        Assert.Equal("http", scheme.GetProperty("type").GetString());
        Assert.Equal("bearer", scheme.GetProperty("scheme").GetString());
        var paths = doc.GetProperty("paths");
        foreach (var (path, verb) in new[] { ("/api/admin/events", "get"), ("/api/admin/events", "post"), ("/api/admin/events/{idOrSlug}", "get"), ("/api/admin/events/{idOrSlug}", "patch"), ("/api/admin/events/{idOrSlug}", "delete") })
        {
            var security = paths.GetProperty(path).GetProperty(verb).GetProperty("security");
            Assert.Contains(security.EnumerateArray(), s => s.TryGetProperty("Bearer", out _));
        }

        Assert.False(paths.GetProperty("/api/events").GetProperty("get").TryGetProperty("security", out _));
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private sealed class LimitedFactory(int perToken, int perIp) : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("AdminApi:PerTokenPerMinute", perToken.ToString(System.Globalization.CultureInfo.InvariantCulture));
            builder.UseSetting("AdminApi:PerIpPerMinute", perIp.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }
    }
}
