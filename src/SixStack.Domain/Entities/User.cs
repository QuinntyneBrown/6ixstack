using SixStack.Domain.Enums;

namespace SixStack.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }

    public List<CommunityOrganizer> Communities { get; set; } = [];

    /// <summary>The account a first sign-in creates: an organizer with no community yet (L2-047).</summary>
    public static User CreateOrganizer(string email, DateTimeOffset now) =>
        new() { Email = email, Role = UserRole.Organizer, CreatedAtUtc = now };

    public string Initials =>
        string.IsNullOrWhiteSpace(Name)
            ? Email[..1].ToUpperInvariant()
            : string.Concat(Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => char.ToUpperInvariant(p[0])));
}
