using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Identity;

/// <summary>L2-048 and L2-050: sessions are server-side, expire after 14 idle days and can be revoked.</summary>
public sealed class SessionTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Me_describes_the_signed_in_user_for_the_header()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Moderator);

        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");

        Assert.Equal("moderator", me.GetProperty("role").GetString());
        Assert.False(string.IsNullOrEmpty(me.GetProperty("name").GetString()));
        Assert.False(string.IsNullOrEmpty(me.GetProperty("initials").GetString()));
    }

    [Fact]
    public async Task A_revoked_session_is_anonymous()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Organizer);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);
        await factory.WithDbAsync(async db =>
        {
            foreach (var s in await db.Sessions.ToListAsync()) s.RevokedAtUtc = ApiFactory.Today;
            return await db.SaveChangesAsync();
        });

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task A_session_idle_for_14_days_has_expired()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.Moderator);
        await factory.WithDbAsync(async db =>
        {
            foreach (var s in await db.Sessions.Where(s => s.RevokedAtUtc == null).ToListAsync()) s.LastSeenAtUtc = ApiFactory.Today.AddDays(-14).AddMinutes(-1);
            return await db.SaveChangesAsync();
        });

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Each_sign_in_is_its_own_session()
    {
        var phone = factory.CreateHttpsClient();
        var laptop = factory.CreateHttpsClient();
        await phone.SignInAsAsync(HttpClientExtensions.Organizer);
        await laptop.SignInAsAsync(HttpClientExtensions.Organizer);

        var sessions = await factory.WithDbAsync(db => db.Sessions.CountAsync(s => s.User!.Email == HttpClientExtensions.Organizer && s.RevokedAtUtc == null));

        Assert.True(sessions >= 2);
    }
}
