using SixStack.Domain.Entities;
using SixStack.Domain.Enums;
using SixStack.Domain.Exceptions;

namespace SixStack.Domain.Tests;

/// <summary>Soft delete keeps the row and changes the status (L2-109).</summary>
public sealed class EventDeleteTests
{
    [Theory]
    [InlineData(EventStatus.Published)]
    [InlineData(EventStatus.InReview)]
    [InlineData(EventStatus.Rejected)]
    public void Delete_marks_the_event_deleted_and_changes_its_version(EventStatus status)
    {
        var e = new Event { Status = status };
        var version = e.Version;

        e.Delete();

        Assert.Equal(EventStatus.Deleted, e.Status);
        Assert.NotEqual(version, e.Version);
    }

    [Fact]
    public void Delete_of_a_deleted_event_is_refused()
    {
        var e = new Event { Status = EventStatus.Deleted };

        Assert.Throws<InvalidStatusTransitionException>(e.Delete);
    }
}
