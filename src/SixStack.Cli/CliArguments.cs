namespace SixStack.Cli;

/// <summary>A command line that cannot be run: unknown option, missing value or bad value. Exit code 1.</summary>
public sealed class CliUsageException(string message) : Exception(message);

/// <summary>
/// Hand-rolled parser (ADR 0011): positional words, <c>--name value</c> options and value-less flags. Any option the
/// command does not declare is a usage error that names it.
/// </summary>
public sealed class CliArguments
{
    private readonly Dictionary<string, string> values;
    private readonly HashSet<string> flags;

    private CliArguments(List<string> positionals, Dictionary<string, string> values, HashSet<string> flags)
    {
        Positionals = positionals;
        this.values = values;
        this.flags = flags;
    }

    public IReadOnlyList<string> Positionals { get; }

    public static CliArguments Parse(IEnumerable<string> args, IReadOnlyCollection<string> options, IReadOnlyCollection<string> flags)
    {
        var positionals = new List<string>();
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        var set = new HashSet<string>(StringComparer.Ordinal);
        using var e = args.GetEnumerator();
        while (e.MoveNext())
        {
            var arg = e.Current;
            if (!arg.StartsWith("--", StringComparison.Ordinal))
            {
                positionals.Add(arg);
            }
            else if (flags.Contains(arg))
            {
                set.Add(arg);
            }
            else if (options.Contains(arg))
            {
                if (!e.MoveNext())
                {
                    throw new CliUsageException($"Option {arg} needs a value.");
                }

                if (!values.TryAdd(arg, e.Current))
                {
                    throw new CliUsageException($"Option {arg} is given more than once.");
                }
            }
            else
            {
                throw new CliUsageException($"Unknown option {arg}.");
            }
        }

        return new CliArguments(positionals, values, set);
    }

    public bool Has(string flag) => flags.Contains(flag);

    public string? Get(string option) => values.GetValueOrDefault(option);

    public bool IsSet(string option) => values.ContainsKey(option);
}
