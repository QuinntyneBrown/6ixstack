using SixStack.Application.Organizer;

namespace SixStack.Infrastructure.Organizer;

/// <summary>
/// The production attendee directory: tickets are sold on organizers' own sites, so 6ixstack knows nobody going yet
/// (cancel-event design). The cancel dialog then offers no email.
/// </summary>
public sealed class NoAttendeeDirectory : IAttendeeDirectory
{
    public Task<IReadOnlyList<string>> EmailsGoingToAsync(Guid eventId, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<string>>([]);
}
