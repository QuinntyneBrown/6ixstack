using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Auth;

public sealed class TestSignInSeamTests(TestSignInSeamTests.SeamDisabledFactory factory) : IClassFixture<TestSignInSeamTests.SeamDisabledFactory>
{
    [Fact]
    public async Task Seam_does_not_exist_unless_enabled()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsJsonAsync("/api/test/sign-in", new { email = HttpClientExtensions.Organizer });

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.NotFound, HttpStatusCode.Unauthorized });
        Assert.False(response.Headers.Contains("Set-Cookie"));
    }

    public sealed class SeamDisabledFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Auth:TestSignIn:Enabled", "false");
        }
    }
}
