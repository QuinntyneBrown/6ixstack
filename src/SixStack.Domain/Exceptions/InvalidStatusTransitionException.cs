using SixStack.Domain.Enums;

namespace SixStack.Domain.Exceptions;

public sealed class InvalidStatusTransitionException(EventStatus from, string action)
    : InvalidOperationException($"Cannot {action} an event that is {from}.");
