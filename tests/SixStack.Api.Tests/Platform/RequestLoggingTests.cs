using System.Net;
using Microsoft.Extensions.Logging;

namespace SixStack.Api.Tests.Platform;

/// <summary>L2-101: one structured log entry per request, outside the exception handler, with a correlation id.</summary>
public sealed class RequestLoggingTests(PlatformFactory factory) : IClassFixture<PlatformFactory>
{
    [Fact]
    public async Task Response_carries_the_correlation_id_that_the_request_log_records()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/ok/7?email=priya@gtaazure.ca");

        var correlationId = Assert.Single(response.Headers.GetValues("X-Correlation-Id"));
        var entry = Assert.Single(factory.RequestLogs, e => Equals(e.State.GetValueOrDefault("CorrelationId"), correlationId));
        Assert.Equal("GET", entry.State["Method"]);
        Assert.Equal("api/test-probe/ok/{id}", entry.State["Route"]);
        Assert.Equal(200, entry.State["StatusCode"]);
        Assert.IsType<double>(entry.State["DurationMs"]);
        Assert.Equal(LogLevel.Information, entry.Level);
        Assert.DoesNotContain("priya@gtaazure.ca", entry.Message);
    }

    [Fact]
    public async Task Handled_error_is_logged_with_its_final_status()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/missing");

        var correlationId = Assert.Single(response.Headers.GetValues("X-Correlation-Id"));
        var entry = Assert.Single(factory.RequestLogs, e => Equals(e.State.GetValueOrDefault("CorrelationId"), correlationId));
        Assert.Equal(404, entry.State["StatusCode"]);
    }

    [Fact]
    public async Task Unhandled_error_is_logged_as_500_at_error_level()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/test-probe/boom");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var correlationId = Assert.Single(response.Headers.GetValues("X-Correlation-Id"));
        var entry = Assert.Single(factory.RequestLogs, e => Equals(e.State.GetValueOrDefault("CorrelationId"), correlationId));
        Assert.Equal(500, entry.State["StatusCode"]);
        Assert.Equal(LogLevel.Error, entry.Level);
    }

    [Fact]
    public async Task Unmatched_path_is_logged_without_the_raw_path()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/no/such/thing?token=secret");

        var correlationId = Assert.Single(response.Headers.GetValues("X-Correlation-Id"));
        var entry = Assert.Single(factory.RequestLogs, e => Equals(e.State.GetValueOrDefault("CorrelationId"), correlationId));
        Assert.Equal("(unmatched)", entry.State["Route"]);
        Assert.DoesNotContain("secret", entry.Message);
    }
}
