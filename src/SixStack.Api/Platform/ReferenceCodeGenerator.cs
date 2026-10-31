using System.Security.Cryptography;

namespace SixStack.Api.Platform;

/// <summary>Short codes such as <c>7F3A-21C9</c> that tie a 500 response to its log entry (L2-102). Not guaranteed unique.</summary>
public static class ReferenceCodeGenerator
{
    public static string New()
    {
        var value = BitConverter.ToUInt32(RandomNumberGenerator.GetBytes(4));
        var hex = value.ToString("X8", System.Globalization.CultureInfo.InvariantCulture);
        return $"{hex[..4]}-{hex[4..]}";
    }
}
