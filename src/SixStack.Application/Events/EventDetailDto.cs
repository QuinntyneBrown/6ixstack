namespace SixStack.Application.Events;

public sealed record EventDetailDto(
    string Slug,
    string Title,
    string Description,
    string State,
    string Format,
    CommunityLinkDto Community,
    IReadOnlyList<string> Topics,
    DateTileDto DateTile,
    EventFactsDto Facts,
    IReadOnlyList<AgendaItemDto> Agenda,
    IReadOnlyList<SpeakerSummaryDto> Speakers,
    EventActionsDto Actions,
    IReadOnlyList<EventAlertDto> Alerts,
    DockedBarDto? DockedBar);

public sealed record CommunityLinkDto(string Slug, string Name);

public sealed record DateTileDto(string Month, string Day);

public sealed record EventFactsDto(WhenFactDto When, VenueFactDto? Venue, LabelledFactDto? Stream, LabelledFactDto? Price, LabelledFactDto? Attendance);

/// <summary>"Thursday, November 5, 2026" and "9:00 AM – 5:00 PM ET", with a stream's source time and "ended" or "cancelled".</summary>
public sealed record WhenFactDto(string DateLabel, string TimeRange, string? SourceTime, string? Suffix);

public sealed record VenueFactDto(string Name, string Address, string DirectionsUrl, string? TravelNotes);

public sealed record LabelledFactDto(string Label, string? Note);

public sealed record AgendaItemDto(string Time, string Title);

public sealed record SpeakerSummaryDto(string Slug, string Name, string Initials, string Role);

public sealed record LinkDto(string Label, string Href);

public sealed record PrimaryActionDto(string Label, string Url);

/// <summary>"Join the stream": the URL is present only from <c>OpensAtUtc</c> (L2-019).</summary>
public sealed record JoinActionDto(string Label, DateTimeOffset OpensAtUtc, string? Url);

public sealed record EventActionsDto(
    PrimaryActionDto? Primary,
    JoinActionDto? Join,
    bool AddToCalendar,
    bool Share,
    bool Report,
    string? Caption,
    string? RecordingUrl,
    string? SlidesUrl,
    LinkDto? FindAnother,
    LinkDto? Follow);

/// <summary>An action on an alert: a link (<c>Href</c>) or an in-page action named by <c>Kind</c>, e.g. add-to-calendar.</summary>
public sealed record AlertActionDto(string Label, string? Href, string? Kind);

public sealed record EventAlertDto(string Kind, string Title, string? Text, AlertActionDto? Action);

/// <summary>The bar docked to the bottom of phones (L2-023).</summary>
public sealed record DockedBarDto(string When, string Summary, PrimaryActionDto Action);
