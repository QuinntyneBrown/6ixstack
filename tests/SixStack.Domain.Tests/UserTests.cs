using SixStack.Domain.Entities;

namespace SixStack.Domain.Tests;

public sealed class UserTests
{
    [Theory]
    [InlineData("Priya Natarajan", "priya@gtaazure.ca", "PN")]
    [InlineData(null, "jordan@6ixstack.dev", "J")]
    public void Initials_come_from_the_name_or_the_email(string? name, string email, string expected)
    {
        Assert.Equal(expected, new User { Name = name, Email = email }.Initials);
    }
}
