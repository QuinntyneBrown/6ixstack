namespace SixStack.Application.Organizer;

/// <summary>
/// The email addresses of people going to an event (cancel-event design). 6ixstack sells no tickets, so no source
/// exists yet and the production directory knows nobody; the cancel dialog offers email only when it knows someone.
/// </summary>
public interface IAttendeeDirectory
{
    Task<IReadOnlyList<string>> EmailsGoingToAsync(Guid eventId, CancellationToken cancellationToken);
}
