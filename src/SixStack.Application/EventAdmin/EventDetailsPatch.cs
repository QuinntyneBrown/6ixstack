using SixStack.Application.Organizer;

namespace SixStack.Application.EventAdmin;

/// <summary>
/// The fields an <c>events add</c> or <c>events update</c> sets, under the edit form's names; a null field keeps
/// its current value and an empty string clears an optional one (event-admin-cli design).
/// </summary>
public sealed record EventDetailsPatch(
    string? Title = null,
    string? OrganizerName = null,
    string? Description = null,
    IReadOnlyList<string>? Topics = null,
    string? Date = null,
    string? TimeZoneId = null,
    string? StartTime = null,
    string? EndTime = null,
    string? Format = null,
    string? VenueName = null,
    string? City = null,
    string? StreetAddress = null,
    string? StreamUrl = null,
    bool? IsFree = null,
    decimal? PriceCad = null,
    string? TicketUrl = null)
{
    /// <summary>The values a new event starts from: Toronto time and free.</summary>
    public static readonly EventDetailsFormDto Blank = new(
        string.Empty, string.Empty, string.Empty, [], string.Empty, "America/Toronto", string.Empty, string.Empty, string.Empty,
        null, null, null, null, true, null, null);

    /// <summary>No value at all, so every field an added event sets counts as a change.</summary>
    public static readonly EventDetailsFormDto Empty = new(
        string.Empty, string.Empty, string.Empty, [], string.Empty, string.Empty, string.Empty, string.Empty, string.Empty,
        null, null, null, null, false, null, null);

    /// <summary>This patch over <paramref name="form"/>. A price above zero without <c>isFree</c> makes the event paid.</summary>
    public EventDetailsFormDto ApplyTo(EventDetailsFormDto form)
    {
        var isFree = IsFree ?? (PriceCad is { } price ? price == 0 : form.IsFree);
        return new EventDetailsFormDto(
            Title ?? form.Title,
            OrganizerName ?? form.OrganizerName,
            Description ?? form.Description,
            Topics ?? form.Topics,
            Date ?? form.Date,
            TimeZoneId ?? form.TimeZoneId,
            StartTime ?? form.StartTime,
            EndTime ?? form.EndTime,
            Format ?? form.Format,
            VenueName ?? form.VenueName,
            City ?? form.City,
            StreetAddress ?? form.StreetAddress,
            StreamUrl ?? form.StreamUrl,
            isFree,
            isFree ? null : PriceCad ?? form.PriceCad,
            TicketUrl ?? form.TicketUrl);
    }

    /// <summary>The form names whose values differ, in form order.</summary>
    public static IReadOnlyList<string> ChangedFields(EventDetailsFormDto before, EventDetailsFormDto after)
    {
        static string? Text(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        var changes = new List<string>();
        void Check(string name, bool same)
        {
            if (!same)
            {
                changes.Add(name);
            }
        }

        Check("title", Text(before.Title) == Text(after.Title));
        Check("organizerName", Text(before.OrganizerName) == Text(after.OrganizerName));
        Check("description", Text(before.Description) == Text(after.Description));
        Check("topics", before.Topics.Order(StringComparer.OrdinalIgnoreCase).SequenceEqual(after.Topics.Order(StringComparer.OrdinalIgnoreCase), StringComparer.OrdinalIgnoreCase));
        Check("date", before.Date == after.Date);
        Check("timeZoneId", before.TimeZoneId == after.TimeZoneId);
        Check("startTime", before.StartTime == after.StartTime);
        Check("endTime", before.EndTime == after.EndTime);
        Check("format", before.Format == after.Format);
        Check("venueName", Text(before.VenueName) == Text(after.VenueName));
        Check("city", Text(before.City) == Text(after.City));
        Check("streetAddress", Text(before.StreetAddress) == Text(after.StreetAddress));
        Check("streamUrl", Text(before.StreamUrl) == Text(after.StreamUrl));
        Check("isFree", before.IsFree == after.IsFree);
        Check("priceCad", before.PriceCad == after.PriceCad);
        Check("ticketUrl", Text(before.TicketUrl) == Text(after.TicketUrl));
        return changes;
    }
}
