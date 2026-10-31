using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Moderation;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Tests.Identity;

/// <summary>L2-068 to L2-070: GET and PUT /api/account/settings, and confirming a new email.</summary>
public sealed class AccountSettingsTests
{
    private static async Task<HttpClient> As(ApiFactory factory, string email)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static object Body(string name = "Priya Natarajan", string email = HttpClientExtensions.Organizer, string? website = "https://gtaazure.ca",
        bool decisions = true, bool reports = true, bool weekly = false) =>
        new { name, email, website, emailEventDecisions = decisions, emailProblemReports = reports, emailWeeklySummary = weekly };

    [Fact]
    public async Task Settings_show_the_profile_switches_and_community()
    {
        using var factory = new ApiFactory();

        var s = await (await As(factory, HttpClientExtensions.Organizer)).GetFromJsonAsync<JsonElement>("/api/account/settings");

        Assert.Equal(("Priya Natarajan", HttpClientExtensions.Organizer, true, true, false),
            (s.GetProperty("name").GetString(), s.GetProperty("email").GetString(), s.GetProperty("emailEventDecisions").GetBoolean(),
             s.GetProperty("emailProblemReports").GetBoolean(), s.GetProperty("emailWeeklySummary").GetBoolean()));
        var community = s.GetProperty("community");
        Assert.Equal(("GTA Azure Community", "gta-azure-community", 2),
            (community.GetProperty("name").GetString(), community.GetProperty("slug").GetString(), community.GetProperty("coOrganizerCount").GetInt32()));
    }

    [Fact]
    public async Task Saving_keeps_the_name_website_and_switches()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        var response = await priya.PutAsJsonAsync("/api/account/settings", Body(name: "Priya N.", weekly: true, reports: false));
        var s = await priya.GetFromJsonAsync<JsonElement>("/api/account/settings");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("9:00 AM", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("savedAtLabel").GetString());
        Assert.Equal(("Priya N.", "https://gtaazure.ca", true, false),
            (s.GetProperty("name").GetString(), s.GetProperty("website").GetString(), s.GetProperty("emailWeeklySummary").GetBoolean(), s.GetProperty("emailProblemReports").GetBoolean()));
    }

    [Fact]
    public async Task A_blank_name_and_a_bare_website_are_refused()
    {
        using var factory = new ApiFactory();

        var response = await (await As(factory, HttpClientExtensions.Organizer)).PutAsJsonAsync("/api/account/settings", Body(name: " ", website: "gtaazure"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter your name.", errors.GetProperty("name")[0].GetString());
        Assert.Equal("Enter a full link like https://gtaazure.ca", errors.GetProperty("website")[0].GetString());
    }

    [Fact]
    public async Task A_new_email_waits_for_its_confirmation_link()
    {
        using var factory = new ApiFactory();
        var priya = await As(factory, HttpClientExtensions.Organizer);

        await priya.PutAsJsonAsync("/api/account/settings", Body(email: "priya@newmail.ca"));
        await factory.RunOutboxAsync();

        var s = await priya.GetFromJsonAsync<JsonElement>("/api/account/settings");
        Assert.Equal((HttpClientExtensions.Organizer, "priya@newmail.ca"), (s.GetProperty("email").GetString(), s.GetProperty("pendingEmail").GetString()));
        var mail = factory.Services.GetRequiredService<DevMailbox>().For("priya@newmail.ca").Single().Message;
        Assert.Equal("Confirm your new email for 6ixstack", mail.Subject);
        var link = System.Text.RegularExpressions.Regex.Match(mail.TextBody, @"https://\S+confirm-email\S+").Value;

        var confirm = await factory.CreateHttpsClient().GetAsync(new Uri(link).PathAndQuery);

        Assert.Equal(HttpStatusCode.Redirect, confirm.StatusCode);
        Assert.Equal("priya@newmail.ca", await factory.WithDbAsync(db => db.Users.Where(u => u.Name == "Priya Natarajan").Select(u => u.Email).SingleAsync()));
    }

    [Fact]
    public async Task An_organizer_without_a_community_is_told_so()
    {
        using var factory = new ApiFactory();
        await factory.RequestLink("solo@example.com");
        var client = factory.CreateHttpsClient();
        await client.RedeemAsync(await factory.LatestToken("solo@example.com"));

        var s = await client.GetFromJsonAsync<JsonElement>("/api/account/settings");

        Assert.Equal(JsonValueKind.Null, s.GetProperty("community").ValueKind);
    }

    [Fact]
    public async Task Anonymous_callers_are_refused()
    {
        using var factory = new ApiFactory();

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/account/settings")).StatusCode);
    }
}
