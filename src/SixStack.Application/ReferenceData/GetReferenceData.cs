using MediatR;
using SixStack.Application.Common;

namespace SixStack.Application.ReferenceData;

public sealed record TopicOptionDto(string Key, string Label);

public sealed record TimeZoneOptionDto(string Id, string Label);

public sealed record ReferenceDataDto(IReadOnlyList<TopicOptionDto> Topics, IReadOnlyList<string> Cities, IReadOnlyList<TimeZoneOptionDto> TimeZones);

/// <summary>The lists the submit and edit forms offer (L2-041, L2-045).</summary>
public sealed record GetReferenceDataQuery : IRequest<ReferenceDataDto>
{
    public static readonly string[] Cities = ["Toronto", "Mississauga", "Brampton", "Markham", "Vaughan", "Oakville", "Richmond Hill", "Online only"];

    public static readonly TimeZoneOptionDto[] TimeZones =
    [
        new("America/Toronto", "America/Toronto (ET)"),
        new("America/Vancouver", "America/Vancouver (PT)"),
        new("America/Denver", "America/Denver (MT)"),
        new("Europe/London", "Europe/London (GMT)"),
        new("Europe/Paris", "Europe/Paris (CET)"),
    ];
}

public sealed class GetReferenceDataQueryHandler : IRequestHandler<GetReferenceDataQuery, ReferenceDataDto>
{
    public Task<ReferenceDataDto> Handle(GetReferenceDataQuery request, CancellationToken cancellationToken) =>
        Task.FromResult(new ReferenceDataDto(
            [.. TopicKeys.ByKey.Keys.Select(k => new TopicOptionDto(k, TopicKeys.Label(k)))],
            GetReferenceDataQuery.Cities,
            GetReferenceDataQuery.TimeZones));
}
