using System.Globalization;

namespace SixStack.Application.Common.Time;

/// <summary>Every 6ixstack screen shows Toronto time (ET); streams also show their source time (platform/time-zones).</summary>
public static class TorontoTime
{
    public static readonly TimeZoneInfo Zone = TimeZoneInfo.FindSystemTimeZoneById("America/Toronto");

    private static readonly CultureInfo En = CultureInfo.GetCultureInfo("en-US");

    public static DateTime ToLocal(DateTimeOffset utc) => TimeZoneInfo.ConvertTime(utc, Zone).DateTime;

    public static DateOnly Today(DateTimeOffset now) => DateOnly.FromDateTime(ToLocal(now));

    /// <summary>The instant a Toronto calendar day starts.</summary>
    public static DateTimeOffset StartOf(DateOnly day)
    {
        var local = day.ToDateTime(TimeOnly.MinValue);
        return new DateTimeOffset(local, Zone.GetUtcOffset(local)).ToUniversalTime();
    }

    /// <summary>"6:00 PM".</summary>
    public static string Time(DateTimeOffset utc) => ToLocal(utc).ToString("h:mm tt", En);

    /// <summary>"9:00 AM PT": the time in another zone with its short name.</summary>
    public static string TimeIn(DateTimeOffset utc, string timeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = TimeZoneInfo.ConvertTime(utc, zone);
        return $"{local.ToString("h:mm tt", En)} {ShortName(timeZoneId, zone.IsDaylightSavingTime(local))}";
    }

    public static string Weekday(DateOnly day) => day.ToString("dddd", En);

    /// <summary>"November 3".</summary>
    public static string MonthDay(DateOnly day) => day.ToString("MMMM d", En);

    private static string ShortName(string timeZoneId, bool daylight) => timeZoneId switch
    {
        "America/Toronto" or "America/New_York" => "ET",
        "America/Chicago" => "CT",
        "America/Denver" or "America/Edmonton" or "America/Phoenix" => "MT",
        "America/Los_Angeles" or "America/Vancouver" => "PT",
        "Europe/London" or "Europe/Dublin" => daylight ? "BST" : "GMT",
        "Europe/Amsterdam" or "Europe/Berlin" or "Europe/Paris" or "Europe/Madrid" or "Europe/Rome" => daylight ? "CEST" : "CET",
        "UTC" or "Etc/UTC" => "UTC",
        _ => timeZoneId,
    };
}
