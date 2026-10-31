using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Infrastructure.Outbox;

namespace SixStack.Api.Tests.Moderation;

public sealed record QueueCheck(string Kind, string Outcome, string Message);

public sealed record QueueCard(string Title, string Organizer, string WhenLabel, string WhereLabel, string[] Topics, string SubmittedLabel, string SubmitterEmail, QueueCheck[] Checks);

public static class QueueClient
{
    /// <summary>Runs every due outbox message, which includes the automated checks.</summary>
    public static async Task RunOutboxAsync(this ApiFactory factory)
    {
        await factory.WithDbAsync(_ => Task.FromResult(0)); // creates and seeds the fixture's database
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<OutboxDispatcher>().ProcessDueAsync(CancellationToken.None);
    }

    public static async Task<(string Summary, QueueCard[] Cards)> QueueAsModeratorAsync(this ApiFactory factory)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Moderator);
        var queue = await client.GetFromJsonAsync<JsonElement>("/api/moderation/queue");
        var cards = queue.GetProperty("cards").Deserialize<QueueCard[]>(new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        return (queue.GetProperty("summary").GetString()!, cards);
    }

    public static QueueCheck Check(this QueueCard card, string message) => card.Checks.Single(c => c.Message == message);
}
