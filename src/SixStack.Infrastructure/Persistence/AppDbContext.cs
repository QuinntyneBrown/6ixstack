using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Community> Communities => Set<Community>();
    public DbSet<Speaker> Speakers => Set<Speaker>();
    public DbSet<EventSpeaker> EventSpeakers => Set<EventSpeaker>();
    public DbSet<User> Users => Set<User>();
    public DbSet<CommunityOrganizer> CommunityOrganizers => Set<CommunityOrganizer>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<SecurityToken> SecurityTokens => Set<SecurityToken>();
    public DbSet<VerifiedEmail> VerifiedEmails => Set<VerifiedEmail>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SubmissionCheck> SubmissionChecks => Set<SubmissionCheck>();
    public DbSet<ModerationDecision> ModerationDecisions => Set<ModerationDecision>();
    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<ProblemReport> ProblemReports => Set<ProblemReport>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<ReviewPresence> ReviewPresences => Set<ReviewPresence>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // SQLite cannot compare or order DateTimeOffset values; store them as sortable binary
        // in tests and Playwright runs. SQL Server keeps its native datetimeoffset type.
        if (Database.IsSqlite())
        {
            foreach (var property in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetProperties()))
            {
                if (property.ClrType == typeof(DateTimeOffset))
                {
                    property.SetValueConverter(new DateTimeOffsetToBinaryConverter());
                }
                else if (property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(new DateTimeOffsetToBinaryConverter());
                }
            }
        }
    }
}
