using Microsoft.EntityFrameworkCore;
using SixStack.Domain.Entities;

namespace SixStack.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Event> Events { get; }
    DbSet<Community> Communities { get; }
    DbSet<Speaker> Speakers { get; }
    DbSet<EventSpeaker> EventSpeakers { get; }
    DbSet<User> Users { get; }
    DbSet<CommunityOrganizer> CommunityOrganizers { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    DbSet<SecurityToken> SecurityTokens { get; }
    DbSet<VerifiedEmail> VerifiedEmails { get; }
    DbSet<Session> Sessions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
