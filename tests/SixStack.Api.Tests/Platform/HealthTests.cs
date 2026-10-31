using System.Net;
using Microsoft.AspNetCore.Hosting;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Platform;

/// <summary>L2-103: liveness and readiness endpoints for anonymous callers.</summary>
public sealed class HealthTests(PlatformFactory factory) : IClassFixture<PlatformFactory>
{
    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task Health_endpoints_answer_healthy_without_a_session(string path)
    {
        var response = await factory.CreateHttpsClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }
}

public sealed class ReadinessWithoutDatabaseTests(ReadinessWithoutDatabaseTests.UnreachableDatabaseFactory factory)
    : IClassFixture<ReadinessWithoutDatabaseTests.UnreachableDatabaseFactory>
{
    [Fact]
    public async Task Readiness_is_unhealthy_when_the_database_is_unreachable_while_liveness_stays_healthy()
    {
        var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });

        var ready = await client.GetAsync("/health/ready");
        var live = await client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, ready.StatusCode);
        Assert.Equal("Unhealthy", await ready.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
    }

    /// <summary>Points the API at a database file in a folder that does not exist.</summary>
    public sealed class UnreachableDatabaseFactory : Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("Database:Provider", "Sqlite");
            builder.UseSetting("ConnectionStrings:Default", $"Data Source=/nonexistent-{Guid.NewGuid():N}/sixstack.db;Mode=ReadOnly");
            builder.UseSetting("Outbox:Enabled", "false");
        }
    }
}
