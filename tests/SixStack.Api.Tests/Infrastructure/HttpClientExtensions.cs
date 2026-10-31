using System.Net.Http.Json;

namespace SixStack.Api.Tests.Infrastructure;

public static class HttpClientExtensions
{
    public const string Organizer = "priya@gtaazure.ca";
    public const string Moderator = "jordan@6ixstack.dev";

    /// <summary>Signs the client in as a seeded user through the test-only seam.</summary>
    public static async Task SignInAsAsync(this HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/test/sign-in", new { email });
        response.EnsureSuccessStatusCode();
    }
}
