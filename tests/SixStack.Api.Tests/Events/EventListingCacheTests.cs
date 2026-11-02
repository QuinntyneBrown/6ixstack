using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Events;

/// <summary>L2-125 to L2-127: the API's event listing cache, entity tags and cache headers.</summary>
public sealed class EventListingCacheTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static HttpRequestMessage Get(string url, string? ifNoneMatch = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (ifNoneMatch is not null)
        {
            request.Headers.TryAddWithoutValidation("If-None-Match", ifNoneMatch);
        }

        return request;
    }

    [Fact]
    public async Task A_listing_carries_a_strong_etag_that_is_the_hash_of_its_body()
    {
        var response = await factory.CreateHttpsClient().SendAsync(Get("/api/events"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var etag = response.Headers.ETag;
        Assert.NotNull(etag);
        Assert.False(etag.IsWeak);
        var body = await response.Content.ReadAsByteArrayAsync();
        var expected = $"\"{Convert.ToHexStringLower(SHA256.HashData(body).AsSpan(0, 16))}\"";
        Assert.Equal(expected, etag.Tag);
    }

    [Fact]
    public async Task A_matching_if_none_match_is_answered_304_with_no_body()
    {
        var client = factory.CreateHttpsClient();
        var first = await client.SendAsync(Get("/api/events?format=gta"));
        var tag = first.Headers.ETag!.Tag;

        var second = await client.SendAsync(Get("/api/events?format=gta", tag));

        Assert.Equal(HttpStatusCode.NotModified, second.StatusCode);
        Assert.Empty(await second.Content.ReadAsByteArrayAsync());
        Assert.Equal(tag, second.Headers.ETag?.Tag);
    }

    [Fact]
    public async Task A_tag_in_a_list_matches()
    {
        var client = factory.CreateHttpsClient();
        var tag = (await client.SendAsync(Get("/api/events?format=streaming"))).Headers.ETag!.Tag;

        var second = await client.SendAsync(Get("/api/events?format=streaming", $"\"0000\", {tag}"));

        Assert.Equal(HttpStatusCode.NotModified, second.StatusCode);
    }
}
