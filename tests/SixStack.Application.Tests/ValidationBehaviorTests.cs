using FluentValidation;
using MediatR;
using SixStack.Application.Common.Behaviors;

namespace SixStack.Application.Tests;

public sealed class ValidationBehaviorTests
{
    private sealed record Ping(string Name) : IRequest<string>;

    private sealed class PingValidator : AbstractValidator<Ping>
    {
        public PingValidator() => RuleFor(p => p.Name).NotEmpty().MaximumLength(5);
    }

    [Fact]
    public async Task Invalid_request_never_reaches_the_handler()
    {
        var behavior = new ValidationBehavior<Ping, string>([new PingValidator()]);
        var reached = false;

        var ex = await Assert.ThrowsAsync<ValidationException>(() => behavior.Handle(new Ping(""), _ =>
        {
            reached = true;
            return Task.FromResult("pong");
        }, CancellationToken.None));

        Assert.False(reached);
        Assert.Contains(ex.Errors, e => e.PropertyName == nameof(Ping.Name));
    }

    [Fact]
    public async Task Valid_request_runs_the_handler()
    {
        var behavior = new ValidationBehavior<Ping, string>([new PingValidator()]);

        var result = await behavior.Handle(new Ping("ok"), _ => Task.FromResult("pong"), CancellationToken.None);

        Assert.Equal("pong", result);
    }
}
