using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Api.Tests.Submissions;

/// <summary>The dev mailbox endpoint lets tests and demos read sent emails; it exists only when exposed.</summary>
public sealed class DevMailboxEndpointTests
{
    [Fact]
    public async Task Lists_emails_newest_first_when_exposed()
    {
        using var factory = new ApiFactory();
        var sender = factory.Services.GetRequiredService<IEmailSender>();
        await sender.SendAsync(new EmailMessage("a@example.com", "First", "one"));
        await sender.SendAsync(new EmailMessage("a@example.com", "Second", "two"));

        var mail = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/dev/mailbox?to=a@example.com");

        Assert.Equal(["Second", "First"], mail.EnumerateArray().Select(m => m.GetProperty("subject").GetString()));
    }

    [Fact]
    public async Task Does_not_exist_unless_exposed()
    {
        using var factory = new HiddenFactory();

        var response = await factory.CreateHttpsClient().GetAsync("/api/dev/mailbox");

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.NotFound, HttpStatusCode.Unauthorized });
    }

    private sealed class HiddenFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("DevMailbox:Expose", "false");
        }
    }
}
