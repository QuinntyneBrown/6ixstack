using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Infrastructure.Identity;

/// <summary>32 random bytes as Base64Url for the link; the database keeps only the SHA-256 hash (L2-084).</summary>
public sealed class SecurityTokenService(IAppDbContext db, IClock clock) : ISecurityTokenService
{
    public string Issue(string email, SecurityTokenPurpose purpose, TimeSpan lifetime, string? returnUrl = null)
    {
        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var now = clock.UtcNow;
        db.SecurityTokens.Add(new SecurityToken
        {
            Email = email,
            TokenHash = Hash(token),
            Purpose = purpose,
            CreatedAtUtc = now,
            ExpiresAtUtc = now + lifetime,
            ReturnUrl = returnUrl,
        });
        return token;
    }

    public string Hash(string token) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
