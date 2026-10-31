using Microsoft.EntityFrameworkCore;
using SixStack.Application.Common.Interfaces;
using SixStack.Domain.Entities;

namespace SixStack.Application.Notifications;

/// <summary>
/// Whether an address wants a kind of notification email (L2-067). An address without an account has the defaults:
/// decisions and reports on, summary and follows off.
/// </summary>
public sealed class EmailPolicy(IAppDbContext db)
{
    public async Task<bool> WantsAsync(string email, Func<EmailPreferences, bool> kind, CancellationToken cancellationToken)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var prefs = await db.Users.AsNoTracking().Where(u => u.Email == normalized).Select(u => u.EmailPreferences).SingleOrDefaultAsync(cancellationToken);
        return kind(prefs ?? new EmailPreferences());
    }
}
