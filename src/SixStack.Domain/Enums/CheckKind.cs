namespace SixStack.Domain.Enums;

/// <summary>The automated checks on a submission (L2-059), in the order a card lists them.</summary>
public enum CheckKind
{
    VenueAddress = 0,
    TicketLink = 1,
    StreamLink = 2,
    Duplicate = 3,
    OrganizerHistory = 4,
    DeveloperRelevance = 5,
}

public enum CheckOutcome
{
    Pending = 0,
    Passed = 1,
    Warning = 2,
}

public enum DecisionKind
{
    Approved = 0,
    Rejected = 1,
    RequestChanges = 2,
}

/// <summary>Why a moderator turned a submission down (L2-061).</summary>
public enum RejectionReason
{
    MissingVenueAddress = 0,
    NotDeveloperEvent = 1,
    Duplicate = 2,
    SpamOrAdvertising = 3,
    CodeOfConduct = 4,
}
