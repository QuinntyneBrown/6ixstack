using System.Net;
using System.Net.Sockets;
using SixStack.Application.Common.Interfaces;

namespace SixStack.Infrastructure.Checks;

/// <summary>
/// Requests a link with a 5 s timeout, without following redirects (a 3xx already counts as reachable). Hosts that
/// resolve to loopback, private or link-local addresses are never requested, so a submission cannot make the server
/// probe its own network.
/// </summary>
public sealed class HttpLinkChecker(HttpClient http) : ILinkChecker
{
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(5);

    public async Task<LinkCheckResult> CheckAsync(string url, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
        {
            return LinkCheckResult.Unreachable;
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(Timeout);
        try
        {
            var addresses = IPAddress.TryParse(uri.Host, out var literal)
                ? [literal]
                : await Dns.GetHostAddressesAsync(uri.Host, timeout.Token);
            if (addresses.Length == 0 || addresses.Any(IsInternal))
            {
                return LinkCheckResult.Unreachable;
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, uri);
            using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            var status = (int)response.StatusCode;
            return status is >= 200 and < 400 ? LinkCheckResult.Reachable : LinkCheckResult.Unreachable;
        }
        catch (Exception ex) when (ex is HttpRequestException or SocketException or OperationCanceledException && !cancellationToken.IsCancellationRequested)
        {
            return LinkCheckResult.Unreachable;
        }
    }

    public static bool IsInternal(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address) || address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6UniqueLocal)
        {
            return true;
        }

        var b = address.GetAddressBytes();
        return address.AddressFamily == AddressFamily.InterNetwork && (
            b[0] == 10 || b[0] == 127 || b[0] == 0
            || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
            || (b[0] == 192 && b[1] == 168)
            || (b[0] == 169 && b[1] == 254)
            || (b[0] == 100 && b[1] >= 64 && b[1] <= 127));
    }
}

/// <summary>Treats every link as reachable; tests, Playwright and demos use it to stay off the network.</summary>
public sealed class AssumeReachableLinkChecker : ILinkChecker
{
    public Task<LinkCheckResult> CheckAsync(string url, CancellationToken cancellationToken) => Task.FromResult(LinkCheckResult.Reachable);
}
