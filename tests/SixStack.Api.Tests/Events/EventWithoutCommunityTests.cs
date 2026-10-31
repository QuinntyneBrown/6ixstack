using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>
/// L2-017 and L2-060: an approved submission from an organizer with no community yet still has a public page, by
/// the organizer name it was submitted with.
/// </summary>
public sealed class EventWithoutCommunityTests
{
    [Fact]
    public async Task An_approved_event_without_a_community_opens_by_its_organizer_name()
    {
        using var factory = new ApiFactory();
        var id = await factory.WithDbAsync(async db =>
        {
            var e = await db.Events.SingleAsync(x => x.Slug == "fabric-for-power-bi-developers");
            e.CommunityId = null;
            e.OrganizerName = "Fabric Fans";
            await db.SaveChangesAsync();
            return e.Id;
        });
        var jordan = factory.CreateHttpsClient();
        await jordan.SignInAsAsync(HttpClientExtensions.Moderator);
        (await jordan.PostAsync($"/api/moderation/submissions/{id}/approve", null)).EnsureSuccessStatusCode();

        var response = await factory.CreateHttpsClient().GetAsync("/api/events/fabric-for-power-bi-developers");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var e = await response.Content.ReadFromJsonAsync<JsonElement>();
        var community = e.GetProperty("community");
        Assert.Equal(("Fabric Fans", JsonValueKind.Null), (community.GetProperty("name").GetString(), community.GetProperty("slug").ValueKind));
        Assert.DoesNotContain("Follow", e.GetRawText());
    }
}
