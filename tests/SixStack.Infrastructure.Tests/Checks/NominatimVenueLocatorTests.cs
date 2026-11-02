using System.Net;
using System.Text;
using SixStack.Application.Common.Interfaces;
using SixStack.Infrastructure.Checks;

namespace SixStack.Infrastructure.Tests.Checks;

/// <summary>ADR 0013: production looks venue addresses up on OpenStreetMap Nominatim.</summary>
public sealed class NominatimVenueLocatorTests
{
    private sealed class FakeNominatim(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });
        }
    }

    private static (NominatimVenueLocator Locator, FakeNominatim Server) Locator(HttpStatusCode status, string body)
    {
        var server = new FakeNominatim(status, body);
        return (new NominatimVenueLocator(new HttpClient(server)), server);
    }

    [Fact]
    public async Task A_found_address_gives_its_coordinates_from_an_identified_request_for_Ontario()
    {
        var (locator, server) = Locator(HttpStatusCode.OK, """[{"lat":"43.6597","lon":"-79.3970","display_name":"Bahen Centre"}]""");

        var point = await locator.LocateAsync("40 St George St", "Toronto", CancellationToken.None);

        Assert.Equal(new GeoPoint(43.6597, -79.397), point);
        var uri = Uri.UnescapeDataString(server.Request!.RequestUri!.ToString());
        Assert.StartsWith("https://nominatim.openstreetmap.org/search?", uri);
        Assert.Contains("40 St George St, Toronto, Ontario, Canada", uri.Replace('+', ' '));
        Assert.Contains("6ixstack", server.Request.Headers.UserAgent.ToString());
    }

    [Fact]
    public async Task An_address_Nominatim_cannot_find_sits_at_its_city_reference_point()
    {
        var (locator, _) = Locator(HttpStatusCode.OK, "[]");

        var point = await locator.LocateAsync("Room 202, somewhere", "Mississauga", CancellationToken.None);

        Assert.Equal(new GeoPoint(43.589, -79.644), point);
    }

    [Fact]
    public async Task A_server_error_leaves_the_venue_for_the_next_run()
    {
        var (locator, _) = Locator(HttpStatusCode.ServiceUnavailable, "");

        Assert.Null(await locator.LocateAsync("40 St George St", "Toronto", CancellationToken.None));
    }
}
