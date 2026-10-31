using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Common.Interfaces;

/// <summary>Issues one-time link tokens: the plaintext goes in the email once, only its hash is stored (L2-084).</summary>
public interface ISecurityTokenService
{
    /// <summary>Adds a token row to the unit of work and returns the plaintext for the link.</summary>
    string Issue(string email, SecurityTokenPurpose purpose, TimeSpan lifetime);

    string Hash(string token);
}
