using System.Net.Http.Json;

namespace SixStack.Api.Tests.Infrastructure;

public static class HttpClientExtensions
{
    public const string Organizer = "priya@gtaazure.ca";
    public const string Moderator = "jordan@6ixstack.dev";
    public const string SecondModerator = "sam@6ixstack.dev";

    /// <summary>Signs the client in as a seeded user through the test-only seam.</summary>
    public static async Task SignInAsAsync(this HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/test/sign-in", new { email });
        response.EnsureSuccessStatusCode();

        // Echo the XSRF token on later requests, as the web app does (L2-083).
        var token = response.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? cookies.Select(c => c.Split(';')[0]).FirstOrDefault(c => c.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal))?["XSRF-TOKEN=".Length..]
            : null;
        client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");
        if (token is not null)
        {
            client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", Uri.UnescapeDataString(token));
        }
    }
}
