using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Infrastructure.Email;
using SixStack.Infrastructure.Outbox;

namespace SixStack.Api.Tests.Identity;

/// <summary>Requests a sign-in link and reads its token back from the dev mailbox.</summary>
public static class SignInFlow
{
    public static Task<HttpResponseMessage> RequestLink(this ApiFactory factory, string email, string? returnUrl = null) =>
        factory.CreateHttpsClient().PostAsJsonAsync("/api/auth/sign-in-links", new { email, returnUrl });

    public static async Task<string> LatestToken(this ApiFactory factory, string email)
    {
        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<OutboxDispatcher>().ProcessDueAsync(CancellationToken.None);
        }

        var body = factory.Services.GetRequiredService<DevMailbox>().For(email)
            .Last(m => m.Message.Subject == "Your 6ixstack sign-in link").Message.TextBody;
        var start = body.IndexOf("token=", StringComparison.Ordinal) + "token=".Length;
        return new string(body[start..].TakeWhile(c => !char.IsWhiteSpace(c)).ToArray());
    }
}
