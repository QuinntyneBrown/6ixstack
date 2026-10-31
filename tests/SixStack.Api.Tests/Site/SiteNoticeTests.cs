using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Site;

/// <summary>L2-075: the maintenance notice the site banner shows, for anonymous callers.</summary>
public sealed class SiteNoticeTests
{
    public sealed record Notice(string WindowId, DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc, string Title, string Text);

    [Fact]
    public async Task Upcoming_maintenance_window_is_returned()
    {
        using var factory = new NoticeFactory(endsAtUtc: "2026-11-08T09:00:00Z");

        var notice = await factory.CreateHttpsClient().GetFromJsonAsync<Notice>("/api/site/notice");

        Assert.NotNull(notice);
        Assert.Equal("2026-11-08-submissions", notice.WindowId);
        Assert.Equal("Submissions pause Sunday, Nov 8, 2–4 AM ET", notice.Title);
        Assert.Equal("Browsing and feeds keep working during maintenance.", notice.Text);
    }

    [Fact]
    public async Task Ended_window_returns_no_content()
    {
        using var factory = new NoticeFactory(endsAtUtc: "2026-11-01T09:00:00Z");

        var response = await factory.CreateHttpsClient().GetAsync("/api/site/notice");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task No_configured_window_returns_no_content()
    {
        using var factory = new ApiFactory();

        var response = await factory.CreateHttpsClient().GetAsync("/api/site/notice");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    private sealed class NoticeFactory(string endsAtUtc) : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Maintenance:WindowId", "2026-11-08-submissions");
            builder.UseSetting("Maintenance:StartsAtUtc", "2026-11-08T07:00:00Z");
            builder.UseSetting("Maintenance:EndsAtUtc", endsAtUtc);
            builder.UseSetting("Maintenance:Title", "Submissions pause Sunday, Nov 8, 2–4 AM ET");
            builder.UseSetting("Maintenance:Text", "Browsing and feeds keep working during maintenance.");
        }
    }
}
