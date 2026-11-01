using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixStack.Api.Tests.Infrastructure;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Api.Tests.AdminApi;

/// <summary>Issues API tokens for seeded users straight into the fixture's database, as <c>tokens create</c> stores them.</summary>
public static class AdminApiTokens
{
    public static async Task<(string Token, Guid Id)> IssueTokenAsync(this ApiFactory factory, string email, Action<ApiToken>? change = null)
    {
        var hasher = factory.Services.GetRequiredService<IApiTokenHasher>();
        return await factory.WithDbAsync(async db =>
        {
            var userId = await db.Users.Where(u => u.Email == email).Select(u => u.Id).SingleAsync();
            var row = new ApiToken
            {
                UserId = userId,
                Name = "test-agent",
                CreatedAtUtc = ApiFactory.Today,
                ExpiresAtUtc = ApiFactory.Today.AddDays(ApiToken.DefaultDays),
            };
            var secret = hasher.Create(row.Id);
            row.Salt = secret.Salt;
            row.TokenHash = secret.Hash;
            change?.Invoke(row);
            db.ApiTokens.Add(row);
            await db.SaveChangesAsync();
            return (secret.Token, row.Id);
        });
    }

    /// <summary>An https client that sends <paramref name="token"/> as its bearer credential and no cookie.</summary>
    public static HttpClient CreateTokenClient(this ApiFactory factory, string token)
    {
        var client = factory.CreateHttpsClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
