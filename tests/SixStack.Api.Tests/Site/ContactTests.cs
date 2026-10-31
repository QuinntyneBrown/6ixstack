using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Api.Tests.Moderation;
using SixStack.Infrastructure.Email;

namespace SixStack.Api.Tests.Site;

/// <summary>L2-073: POST /api/contact.</summary>
public sealed class ContactTests
{
    private static object Message(string topic = "listing", string email = "priya@gtaazure.ca", string message = "Please update the venue.") =>
        new { name = "Priya", email, topic, message };

    [Fact]
    public async Task A_message_is_stored_and_delivered_to_the_team()
    {
        using var factory = new ApiFactory();

        var response = await factory.CreateHttpsClient().PostAsJsonAsync("/api/contact", Message());
        await factory.RunOutboxAsync();

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(("Priya", "priya@gtaazure.ca"), (await response.Content.ReadFromJsonAsync<JsonElement>()) is var r
            ? (r.GetProperty("firstName").GetString(), r.GetProperty("replyTo").GetString()) : default);
        Assert.True(await factory.WithDbAsync(db => db.ContactMessages.AnyAsync(m => m.Topic == "listing")));
        var mail = factory.Services.GetRequiredService<DevMailbox>().For("hello@6ixstack.dev").Single().Message;
        Assert.Equal("Contact: Listing correction from Priya", mail.Subject);
        Assert.Contains("Reply to: priya@gtaazure.ca", mail.TextBody);
        Assert.Contains("Please update the venue.", mail.TextBody);
    }

    [Fact]
    public async Task A_code_of_conduct_report_goes_to_the_conduct_inbox()
    {
        using var factory = new ApiFactory();

        await factory.CreateHttpsClient().PostAsJsonAsync("/api/contact", Message(topic: "conduct"));
        await factory.RunOutboxAsync();

        var mailbox = factory.Services.GetRequiredService<DevMailbox>();
        Assert.Single(mailbox.For("conduct@6ixstack.dev"));
        Assert.Empty(mailbox.For("hello@6ixstack.dev"));
    }

    [Fact]
    public async Task Missing_or_invalid_fields_are_listed()
    {
        using var factory = new ApiFactory();

        var response = await factory.CreateHttpsClient().PostAsJsonAsync("/api/contact", new { name = "", email = "priya@gtaazure", topic = "nope", message = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter your name.", errors.GetProperty("name")[0].GetString());
        Assert.Equal("Enter an email address like name@example.com", errors.GetProperty("email")[0].GetString());
        Assert.Equal("Choose what it is about.", errors.GetProperty("topic")[0].GetString());
        Assert.Equal("Write a message so we know how to help", errors.GetProperty("message")[0].GetString());
    }

    [Fact]
    public async Task The_sixth_message_from_one_address_in_an_hour_is_refused()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateHttpsClient();

        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.Accepted, (await client.PostAsJsonAsync("/api/contact", Message())).StatusCode);
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/contact", Message())).StatusCode);
    }
}
