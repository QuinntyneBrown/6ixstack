using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Identity;

/// <summary>
/// <c>sxk_</c>, the token id in 32 hex digits, <c>_</c>, then 32 random bytes as Base64Url. The database keeps a
/// 16-byte random salt and SHA-256(salt ‖ secret) in hex; a 256-bit random secret needs no slow hash (ADR 0012).
/// </summary>
public sealed class ApiTokenHasher : IApiTokenHasher
{
    public const string Prefix = "sxk_";
    private const int IdLength = 32;

    public NewApiTokenSecret Create(Guid tokenId)
    {
        var secret = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var salt = Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(16));
        return new NewApiTokenSecret($"{Prefix}{tokenId:N}_{secret}", salt, Convert.ToHexStringLower(Hash(salt, secret)));
    }

    public Guid? ReadId(string token) =>
        token.Length > Prefix.Length + IdLength + 1
        && token.StartsWith(Prefix, StringComparison.Ordinal)
        && token[Prefix.Length + IdLength] == '_'
        && Guid.TryParseExact(token.AsSpan(Prefix.Length, IdLength), "N", out var id)
            ? id
            : null;

    public bool Verify(string token, string salt, string hash)
    {
        if (ReadId(token) is null)
        {
            return false;
        }

        byte[] expected;
        try
        {
            expected = Convert.FromHexString(hash);
        }
        catch (FormatException)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(Hash(salt, token[(Prefix.Length + IdLength + 1)..]), expected);
    }

    private static byte[] Hash(string salt, string secret) =>
        SHA256.HashData([.. Convert.FromHexString(salt), .. Encoding.UTF8.GetBytes(secret)]);
}
