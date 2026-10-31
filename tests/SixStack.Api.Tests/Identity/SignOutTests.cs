using System.Net;
using Microsoft.EntityFrameworkCore;
using SixStack.Api.Tests.Infrastructure;

namespace SixStack.Api.Tests.Identity;

/// <summary>L2-049: POST /auth/sign-out ends this session only.</summary>
public sealed class SignOutTests
{
    [Fact]
    public async Task Signing_out_ends_this_session_and_other_devices_stay_signed_in()
    {
        using var factory = new ApiFactory();
        var laptop = factory.CreateHttpsClient();
        await laptop.SignInAsAsync(HttpClientExtensions.Organizer);
        var phone = factory.CreateHttpsClient();
        await phone.SignInAsAsync(HttpClientExtensions.Organizer);

        var response = await laptop.PostAsync("/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await laptop.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await phone.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(1, await factory.WithDbAsync(db => db.Sessions.CountAsync(s => s.RevokedAtUtc != null)));
    }

    [Fact]
    public async Task Signing_out_without_a_session_is_refused()
    {
        using var factory = new ApiFactory();

        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().PostAsync("/auth/sign-out", null)).StatusCode);
    }
}
