using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Identity;

/// <summary>L2-071 and L2-100: POST /api/account/delete.</summary>
public sealed class DeleteAccountTests
{
    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    [Fact]
    public async Task Deleting_removes_the_account_its_sessions_and_personal_data_but_keeps_community_events()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);
        var other = await As(factory, HttpClientExtensions.Organizer);
        var userId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.Organizer).Select(u => u.Id).SingleAsync());

        var response = await priya.PostAsJsonAsync("/api/account/delete", new { confirmationEmail = "  PRIYA@gtaazure.ca " });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await other.GetAsync("/api/auth/me")).StatusCode);
        Assert.False(await factory.WithDbAsync(db => db.Users.AnyAsync(u => u.Id == userId)));
        Assert.False(await factory.WithDbAsync(db => db.Sessions.AnyAsync(s => s.UserId == userId)));
        Assert.False(await factory.WithDbAsync(db => db.Events.AnyAsync(e => e.SubmitterEmail == HttpClientExtensions.Organizer)));
        Assert.False(await factory.WithDbAsync(db => db.Notifications.AnyAsync(n => n.RecipientEmail == HttpClientExtensions.Organizer)));
        Assert.False(await factory.WithDbAsync(db => db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == HttpClientExtensions.Organizer)));
        var audit = await factory.WithDbAsync(db => db.AuditEntries.SingleAsync(a => a.Action == "AccountDeleted"));
        Assert.DoesNotContain("@", audit.Details ?? string.Empty);
        Assert.Equal(HttpStatusCode.OK, (await factory.CreateHttpsClient().GetAsync("/api/events/azure-data-ai-day-gta")).StatusCode);
    }

    [Fact]
    public async Task A_wrong_email_deletes_nothing()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var response = await priya.PostAsJsonAsync("/api/account/delete", new { confirmationEmail = "priya@gtaazure.com" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("That doesn’t match. Type priya@gtaazure.ca exactly.",
            (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("confirmationEmail")[0].GetString());
        Assert.True(await factory.WithDbAsync(db => db.Users.AnyAsync(u => u.Email == HttpClientExtensions.Organizer)));
    }

    [Fact]
    public async Task The_settings_say_what_deleting_loses()
    {
        using var factory = new ApiFactory();

        var s = await (await As(factory, HttpClientExtensions.Organizer)).GetFromJsonAsync<JsonElement>("/api/account/settings");

        Assert.Equal("You lose access to edit GTA Azure Community events. Published events stay up, managed by your 2 co-organizers. This can’t be undone.",
            s.GetProperty("deletionNotice").GetString());
    }

    [Fact]
    public async Task Anonymous_callers_are_refused()
    {
        using var factory = new ApiFactory();

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().PostAsJsonAsync("/api/account/delete", new { confirmationEmail = "x@y.ca" })).StatusCode);
    }
}
