namespace SixStack.Api.Tests.Submissions;

public static class SubmissionTestData
{
    /// <summary>A valid submission, as the form sends it; override fields with a dictionary.</summary>
    public static Dictionary<string, object?> Valid(string? email = null, string title = "Fabric for Power BI developers") => new()
    {
        ["title"] = title,
        ["organizerName"] = "GTA Azure Community",
        ["description"] = "Move your Power BI reports onto Fabric without rewriting them.",
        ["topics"] = new[] { "azure" },
        ["date"] = "2026-11-18",
        ["timeZoneId"] = "America/Toronto",
        ["startTime"] = "18:30",
        ["endTime"] = "20:30",
        ["format"] = "inPerson",
        ["venueName"] = "Living Arts Centre",
        ["city"] = "Mississauga",
        ["streetAddress"] = "4141 Living Arts Dr",
        ["streamUrl"] = null,
        ["isFree"] = true,
        ["priceCad"] = null,
        ["ticketUrl"] = "https://tickets.example.com/fabric",
        ["contactEmail"] = email ?? $"organizer-{Guid.NewGuid():N}@example.com",
    };

    public static Dictionary<string, object?> With(this Dictionary<string, object?> body, string key, object? value)
    {
        body[key] = value;
        return body;
    }
}
