using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Infrastructure.Caching;

/// <summary>
/// Evicts the event listing cache after a save that adds, changes or deletes anything a listing shows (L2-128,
/// ADR 0014). Every write path in the process saves through <c>AppDbContext</c>, so none needs its own call. A
/// failed save evicts nothing.
/// </summary>
public sealed class ListingChangeInterceptor(IEventListingCache cache) : SaveChangesInterceptor
{
    private static readonly Type[] ListedTypes = [typeof(Event), typeof(Community), typeof(Venue), typeof(Speaker), typeof(EventSpeaker)];

    private readonly ConditionalWeakTable<DbContext, object> pending = [];

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Note(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Note(eventData.Context);
        return ValueTask.FromResult(result);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        Evict(eventData.Context);
        return result;
    }

    public override ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        Evict(eventData.Context);
        return ValueTask.FromResult(result);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData) => Forget(eventData.Context);

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        Forget(eventData.Context);
        return Task.CompletedTask;
    }

    public override void SaveChangesCanceled(DbContextEventData eventData) => Forget(eventData.Context);

    public override Task SaveChangesCanceledAsync(DbContextEventData eventData, CancellationToken cancellationToken = default)
    {
        Forget(eventData.Context);
        return Task.CompletedTask;
    }

    private void Note(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var touched = context.ChangeTracker.Entries().Any(e =>
            e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted
            && ListedTypes.Contains(e.Metadata.ClrType));
        if (touched)
        {
            pending.AddOrUpdate(context, true);
        }
    }

    private void Evict(DbContext? context)
    {
        if (context is not null && pending.Remove(context))
        {
            cache.EvictAll();
        }
    }

    private void Forget(DbContext? context)
    {
        if (context is not null)
        {
            pending.Remove(context);
        }
    }
}
