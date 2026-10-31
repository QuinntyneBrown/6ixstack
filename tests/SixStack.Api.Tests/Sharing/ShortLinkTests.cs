using System.Net;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Sharing;

/// <summary>L2-038: /e/{slug} short links redirect permanently to the event page.</summary>
public sealed class ShortLinkTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Theory]
    [InlineData("azure-data-ai-day-gta")]
    [InlineData("brampton-dev-night-november-social")]
    public async Task A_published_or_cancelled_events_short_link_redirects_with_301(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/e/{slug}");

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        Assert.Equal($"/events/{slug}", response.Headers.Location?.OriginalString);
    }

    [Theory]
    [InlineData("no-such-event")]
    [InlineData("fabric-for-power-bi-developers")]
    public async Task Unknown_or_unpublished_events_are_not_found(string slug)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/e/{slug}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
