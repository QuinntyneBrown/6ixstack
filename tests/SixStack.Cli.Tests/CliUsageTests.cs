namespace SixStack.Cli.Tests;

/// <summary>Usage and help (L2-114 #3, #4); the maintenance commands stay as they were (L2-114 #1, #2 in CliAppTests).</summary>
public sealed class CliUsageTests : IDisposable
{
    private readonly CliHarness cli = new();

    // L2-114 #3: Given no command or an unknown one, then exit code 1 and the usage lists every command.
    [Theory]
    [InlineData]
    [InlineData("drop-everything")]
    [InlineData("events")]
    public async Task Missing_or_unknown_command_prints_the_full_usage(params string[] args)
    {
        var result = await cli.RunAsync(args);

        Assert.Equal(1, result.ExitCode);
        Assert.Contains("sixstack <migrate|seed|reset>", result.Output);
        Assert.Contains("sixstack events <list|get|add|update|delete>", result.Output);
    }

    // L2-114 #4: Given events --help, then exit code 0 and the commands are described.
    [Fact]
    public async Task Events_help_lists_the_commands_and_exit_codes()
    {
        var result = await cli.RunAsync("events", "--help");

        Assert.Equal(0, result.ExitCode);
        foreach (var text in new[] { "events list", "events get", "events add", "events update", "events delete", "--json", "Exit codes", "6 not confirmed" })
        {
            Assert.Contains(text, result.Output);
        }
    }

    // L2-114 #4: Given events <command> --help, then exit code 0 and that command's options are printed.
    [Theory]
    [InlineData("list", new[] { "--status", "--from", "--to", "--search", "--take", "--json" })]
    [InlineData("get", new[] { "<id-or-slug>", "--show-contact", "--json" })]
    [InlineData("add", new[] { "--file", "--title", "--price", "--actor", "SIXSTACK_ACTOR", "--yes", "--dry-run" })]
    [InlineData("update", new[] { "<id-or-slug>", "--file", "--if-version", "--actor", "--yes", "--dry-run" })]
    [InlineData("delete", new[] { "<id-or-slug>", "--if-version", "--actor", "--yes", "--dry-run" })]
    public async Task Command_help_lists_its_options(string command, string[] options)
    {
        var result = await cli.RunAsync("events", command, "--help");

        Assert.Equal(0, result.ExitCode);
        Assert.All(options, o => Assert.Contains(o, result.Output));
    }

    public void Dispose() => cli.Dispose();
}
