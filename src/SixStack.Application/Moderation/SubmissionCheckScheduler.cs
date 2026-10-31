using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;
using SixStack.Domain.Enums;

namespace SixStack.Application.Moderation;

/// <summary>The checks to run on a submission: pending rows plus an outbox message, in the caller's unit of work.</summary>
public interface ISubmissionCheckScheduler
{
    Task ScheduleAsync(Event e, CancellationToken cancellationToken);
}

public sealed record RunSubmissionChecks(Guid EventId);

public sealed class SubmissionCheckScheduler(IAppDbContext db, IOutbox outbox) : ISubmissionCheckScheduler
{
    public async Task ScheduleAsync(Event e, CancellationToken cancellationToken)
    {
        var previous = await db.SubmissionChecks.Where(c => c.EventId == e.Id).ToListAsync(cancellationToken);
        db.SubmissionChecks.RemoveRange(previous);
        foreach (var kind in KindsFor(e))
        {
            db.SubmissionChecks.Add(new SubmissionCheck { EventId = e.Id, Kind = kind, Outcome = CheckOutcome.Pending });
        }

        outbox.Enqueue(new RunSubmissionChecks(e.Id));
    }

    /// <summary>Venue only for in-person and hybrid; one link check per link present; the rest always.</summary>
    public static IEnumerable<CheckKind> KindsFor(Event e)
    {
        if (e.Format != EventFormat.Streaming)
        {
            yield return CheckKind.VenueAddress;
        }

        if (!string.IsNullOrWhiteSpace(e.TicketUrl))
        {
            yield return CheckKind.TicketLink;
        }

        if (e.Format != EventFormat.InPerson && !string.IsNullOrWhiteSpace(e.StreamUrl))
        {
            yield return CheckKind.StreamLink;
        }

        yield return CheckKind.Duplicate;
        yield return CheckKind.OrganizerHistory;
        yield return CheckKind.DeveloperRelevance;
    }
}
