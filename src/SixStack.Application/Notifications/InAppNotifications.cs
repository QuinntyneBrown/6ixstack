using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Exceptions;
using SixStack.Application.Common.Interfaces;
using SixStack.Application.Common.Time;

namespace SixStack.Application.Notifications;

public sealed record NotificationDto(Guid Id, string Tone, string Title, string? Text, string Link, string TimeLabel, bool IsRead);

public sealed record NotificationListDto(int UnreadCount, IReadOnlyList<NotificationDto> Items);

/// <summary>The signed-in person's notifications, newest first, with the unread count (L2-065).</summary>
public sealed record GetNotificationsQuery : IRequest<NotificationListDto>;

/// <summary>Marks one of the signed-in person's notifications read; someone else's answers 404.</summary>
public sealed record MarkNotificationReadCommand(Guid Id) : IRequest;

/// <summary>Marks all of the signed-in person's notifications read.</summary>
public sealed record MarkAllNotificationsReadCommand : IRequest;

/// <summary>Relative labels in Toronto time: "Just now", "12 min ago", "2 h ago", "Yesterday", then "Oct 29".</summary>
public static class NotificationTime
{
    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public static string Label(DateTimeOffset at, DateTimeOffset now)
    {
        var ago = now - at;
        if (ago < TimeSpan.FromMinutes(1))
        {
            return "Just now";
        }

        if (ago < TimeSpan.FromHours(1))
        {
            return $"{(int)ago.TotalMinutes} min ago";
        }

        var day = TorontoTime.Today(at);
        var today = TorontoTime.Today(now);
        if (ago < TimeSpan.FromHours(24) && day == today)
        {
            return $"{(int)ago.TotalHours} h ago";
        }

        return day == today.AddDays(-1) ? "Yesterday" : day.ToString("MMM d", En);
    }
}

public sealed class NotificationHandlers(IAppDbContext db, IClock clock, ICurrentUser current)
    : IRequestHandler<GetNotificationsQuery, NotificationListDto>,
      IRequestHandler<MarkNotificationReadCommand>,
      IRequestHandler<MarkAllNotificationsReadCommand>
{
    public async Task<NotificationListDto> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var email = await MyEmailAsync(cancellationToken);
        var now = clock.UtcNow;
        var items = (await db.Notifications.AsNoTracking().Where(n => n.RecipientEmail == email).ToListAsync(cancellationToken))
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new NotificationDto(n.Id, n.Tone, n.Title, n.Text, n.Link ?? "/", NotificationTime.Label(n.CreatedAtUtc, now), n.ReadAtUtc is not null))
            .ToList();
        return new NotificationListDto(items.Count(i => !i.IsRead), items);
    }

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
    {
        var email = await MyEmailAsync(cancellationToken);
        var n = await db.Notifications.SingleOrDefaultAsync(x => x.Id == request.Id && x.RecipientEmail == email, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");
        n.ReadAtUtc ??= clock.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        var email = await MyEmailAsync(cancellationToken);
        var now = clock.UtcNow;
        foreach (var n in await db.Notifications.Where(x => x.RecipientEmail == email && x.ReadAtUtc == null).ToListAsync(cancellationToken))
        {
            n.ReadAtUtc = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private Task<string> MyEmailAsync(CancellationToken cancellationToken) =>
        db.Users.Where(u => u.Id == current.UserId).Select(u => u.Email).SingleAsync(cancellationToken);
}
