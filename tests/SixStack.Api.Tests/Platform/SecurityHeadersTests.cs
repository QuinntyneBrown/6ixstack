using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace SixStack.Api.Tests.Platform;

/// <summary>L2-083: transport security and response headers on every response.</summary>
public sealed class SecurityHeadersTests(SecurityHeadersTests.HttpsFactory factory) : IClassFixture<SecurityHeadersTests.HttpsFactory>
{
    [Theory]
    [InlineData("/health/live")]
    [InlineData("/api/test-probe/missing")]
    [InlineData("/api/test-probe/boom")]
    [InlineData("/no/such/route")]
    public async Task Every_response_carries_the_security_headers(string path)
    {
        var response = await factory.CreateHttpsClient().GetAsync(path);

        var csp = Assert.Single(response.Headers.GetValues("Content-Security-Policy"));
        foreach (var directive in new[]
                 {
                     "default-src 'self'", "script-src 'self'", "connect-src 'self'", "object-src 'none'",
                     "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
                 })
        {
            Assert.Contains(directive, csp);
        }

        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("strict-origin-when-cross-origin", Assert.Single(response.Headers.GetValues("Referrer-Policy")));
    }

    [Fact]
    public async Task Https_responses_carry_hsts()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/health/live");

        var hsts = Assert.Single(response.Headers.GetValues("Strict-Transport-Security"));
        Assert.Contains("max-age=31536000", hsts);
    }

    [Fact]
    public async Task Plain_http_is_redirected_to_https()
    {
        var client = factory.CreateClient(new() { BaseAddress = new Uri("http://localhost"), AllowAutoRedirect = false });

        var response = await client.GetAsync("/health/live");

        Assert.True(response.StatusCode is HttpStatusCode.TemporaryRedirect or HttpStatusCode.PermanentRedirect or HttpStatusCode.Redirect);
        Assert.Equal("https", response.Headers.Location?.Scheme);
    }

    public sealed class HttpsFactory : PlatformFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("https_port", "443");
        }
    }
}
