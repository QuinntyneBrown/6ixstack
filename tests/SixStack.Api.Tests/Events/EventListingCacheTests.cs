using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
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

    /// <summary>Changes a title behind the application's back, so nothing evicts the cache.</summary>
    private Task<int> RenameUnnoticed(string slug, string title) =>
        factory.WithDbAsync(db => db.Events.Where(e => e.Slug == slug).ExecuteUpdateAsync(s => s.SetProperty(e => e.Title, title)));

    private async Task<string> Body(string url, HttpClient? client = null)
    {
        var response = await (client ?? factory.CreateHttpsClient()).GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadAsStringAsync();
    }

    [Theory]
    [InlineData("/api/events?topics=react", "server-components-one-year-in")]
    [InlineData("/api/events/featured", "azure-data-ai-day-gta")]
    [InlineData("/api/events/map?topics=react", "server-components-one-year-in")]
    [InlineData("/api/events/calendar?month=2026-11&topics=aws", "bedrock-in-the-real-world")]
    public async Task A_repeated_listing_is_answered_from_memory(string url, string slug)
    {
        var before = await Body(url);
        var title = $"Renamed unnoticed {Guid.NewGuid():N}";
        Assert.Equal(1, await RenameUnnoticed(slug, title));

        var again = await Body(url);

        Assert.Equal(before, again);
        Assert.DoesNotContain(title, again);
    }

    [Fact]
    public async Task Other_filters_are_another_entry()
    {
        await Body("/api/events?topics=aws");
        var title = $"Renamed unnoticed {Guid.NewGuid():N}";
        await RenameUnnoticed("bedrock-in-the-real-world", title);

        Assert.DoesNotContain(title, await Body("/api/events?topics=aws"));
        Assert.Contains(title, await Body("/api/events?topics=aws&format=gta"));
    }

    [Fact]
    public async Task Filters_that_differ_only_in_case_order_or_repeats_share_an_entry()
    {
        var first = await Body("/api/events?topics=ai&topics=angular");
        await RenameUnnoticed("signals-all-the-way-down", $"Renamed unnoticed {Guid.NewGuid():N}");

        Assert.Equal(first, await Body("/api/events?topics=Angular&topics=AI&topics=ai"));
    }

    [Fact]
    public async Task A_request_that_fails_validation_is_refused_every_time()
    {
        var client = factory.CreateHttpsClient();
        for (var i = 0; i < 2; i++)
        {
            var response = await client.GetAsync("/api/events?format=maybe");
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        }
    }

    [Fact]
    public async Task Signed_in_and_anonymous_visitors_receive_the_same_listing()
    {
        var anonymous = await Body("/api/events?topics=dotnet");
        var signedIn = factory.CreateHttpsClient();
        await signedIn.SignInAsAsync(HttpClientExtensions.Organizer);

        Assert.Equal(anonymous, await Body("/api/events?topics=dotnet", signedIn));
    }

    // L2-127 #1
    [Theory]
    [InlineData("/api/events")]
    [InlineData("/api/events/featured")]
    [InlineData("/api/events/map")]
    [InlineData("/api/events/calendar?month=2026-11")]
    public async Task Listings_may_be_reused_briefly_by_browsers_and_shared_caches(string url)
    {
        var client = factory.CreateHttpsClient();
        var first = await client.SendAsync(Get(url));
        var notModified = await client.SendAsync(Get(url, first.Headers.ETag!.Tag));

        foreach (var response in new[] { first, notModified })
        {
            Assert.Equal("public, max-age=10, stale-while-revalidate=60", response.Headers.CacheControl?.ToString());
        }
    }

    // L2-127 #2, #3
    [Theory]
    [InlineData("/api/events?format=maybe")]
    [InlineData("/api/events/azure-data-ai-day-gta")]
    public async Task Errors_and_other_endpoints_are_not_publicly_cacheable(string url)
    {
        var response = await factory.CreateHttpsClient().GetAsync(url);

        Assert.False(response.Headers.CacheControl?.Public ?? false);
    }

    // L2-127 #3
    [Fact]
    public async Task The_admin_list_is_not_publicly_cacheable()
    {
        var token = (await SixStack.Api.Tests.AdminApi.AdminApiTokens.IssueTokenAsync(factory, HttpClientExtensions.Moderator)).Token;
        var response = await SixStack.Api.Tests.AdminApi.AdminApiTokens.CreateTokenClient(factory, token).GetAsync("/api/admin/events");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(response.Headers.CacheControl?.Public ?? false);
    }
}
