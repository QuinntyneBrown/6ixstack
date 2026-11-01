namespace SixStack.Application.Common.Interfaces;

/// <summary>A newly issued API token: the plaintext to show once, and the salt and hash to store (L2-120).</summary>
public sealed record NewApiTokenSecret(string Token, string Salt, string Hash);

/// <summary>Issues and verifies personal API tokens of the form <c>sxk_&lt;id&gt;_&lt;secret&gt;</c> (ADR 0012).</summary>
public interface IApiTokenHasher
{
    NewApiTokenSecret Create(Guid tokenId);

    /// <summary>The token id the plaintext names, or null when it is not a well-formed token.</summary>
    Guid? ReadId(string token);

    /// <summary>Whether the plaintext's secret hashes, with the stored salt, to the stored hash; compared in fixed time.</summary>
    bool Verify(string token, string salt, string hash);
}
