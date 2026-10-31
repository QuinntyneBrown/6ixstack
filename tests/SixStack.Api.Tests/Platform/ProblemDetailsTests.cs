using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace SixStack.Api.Tests.Platform;

/// <summary>L2-102: errors are RFC 9457 problem details; unhandled ones carry a logged reference code.</summary>
public sealed partial class ProblemDetailsTests(PlatformFactory factory) : IClassFixture<PlatformFactory>
{
    [Fact]
    public async Task Unhandled_error_returns_500_problem_details_with_a_reference_code_and_no_internals()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/test-probe/boom");
        var body = await response.Content.ReadAsStringAsync();
        var problem = JsonDocument.Parse(body).RootElement;

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(500, problem.GetProperty("status").GetInt32());
        var referenceCode = problem.GetProperty("referenceCode").GetString()!;
        Assert.Matches(ReferenceCodePattern(), referenceCode);
        Assert.False(string.IsNullOrEmpty(problem.GetProperty("correlationId").GetString()));
        Assert.DoesNotContain("hunter2", body);
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain(" at ", body);

        var logged = Assert.Single(factory.Logs.Entries, e => e.Exception?.Message == ProbeController.SecretMessage);
        Assert.Equal(LogLevel.Error, logged.Level);
        Assert.Equal(referenceCode, logged.State["ReferenceCode"]);
    }

    [Fact]
    public async Task Not_found_maps_to_404_problem_details()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/missing");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task Forbidden_maps_to_403_with_owner_and_resource_extensions()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/forbidden");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Toronto .NET User Group", problem.GetProperty("ownerName").GetString());
        Assert.Equal("What's new in the .NET 11 previews", problem.GetProperty("resourceTitle").GetString());
    }

    [Fact]
    public async Task Validation_failure_maps_to_400_with_errors_keyed_by_field()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/invalid");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Enter a title.", problem.GetProperty("errors").GetProperty("Title")[0].GetString());
    }

    [Fact]
    public async Task Rate_limit_maps_to_429_with_retry_after()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/limited");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.Equal(TimeSpan.FromSeconds(90), response.Headers.RetryAfter?.Delta);
    }

    [GeneratedRegex("^[0-9A-F]{4}-[0-9A-F]{4}$")]
    private static partial Regex ReferenceCodePattern();
}
