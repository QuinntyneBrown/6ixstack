"""Communities, speakers, calendar feeds, static pages, contact and status pages."""
from core import *

STATIC_NA = {"loading": "Static content ships with the page; there is nothing to fetch.",
             "empty": "Static content is never empty.",
             "error": "Static content cannot fail to load independently; a server failure shows the server-error page."}
STATUS_NA = {"loading": "Status pages are served immediately with no data to fetch.",
             "empty": "A status page has no collection.",
             "error": "This page is itself the error state."}


def title_block(h1, lead):
    return f'<div class="page-title"><h1>{h1}</h1><p class="lead">{lead}</p></div>'


def tags(ts):
    return "".join(topic_tag(t) for t in ts)


def select(fid, label, options, chosen=None):
    opts = "".join(f'<option{" selected" if o == chosen else ""}>{o}</option>' for o in options)
    return f'<label class="visually-hidden" for="{fid}">{label}</label><select class="select" id="{fid}">{opts}</select>'


def toolbar(sid, label, ph, q="", selects=""):
    v = f' value="{esc(q)}"' if q else ""
    return (f'<div class="toolbar"><form class="search" role="search"><label class="visually-hidden" for="{sid}">{label}</label>{icon("search")}'
            f'<input class="input" id="{sid}" type="search" placeholder="{esc(ph)}"{v}></form>{selects}</div>')


def skeleton_cards(n=6):
    card = (f'<li><div class="dir-card" aria-hidden="true"><div class="dir-card__head">{sk("2.75rem", "2.75rem", "skeleton--rect")}'
            f'<div style="flex: 1;">{sk("70%", "1.1rem")}{sk("45%", "0.85rem")}</div></div>{sk("100%", "0.85rem")}{sk("80%", "0.85rem")}'
            f'<div class="dir-card__foot">{sk("60%", "0.85rem")}</div></div></li>')
    return f'<ul class="card-grid" aria-busy="true">{card * n}</ul>'


# ======================================================================= communities
COMMUNITIES = [
    dict(name="GTA Azure Community", ini="GA", city="Mississauga", members=2140, next=("Azure Data & AI Day GTA", "Thu, Nov 5"), topics=["azure", "ai"], desc="Monthly Azure talks and an annual data & AI day, run by local MVPs since 2019."),
    dict(name="Toronto .NET User Group", ini="TN", city="Toronto", members=3480, next=("What's new in the .NET 11 previews", "Tue, Nov 3"), topics=["dotnet"], desc="The city's oldest .NET meetup. First Tuesday of the month, downtown, pizza after."),
    dict(name="Angular Toronto", ini="AT", city="Toronto", members=1920, next=("Signals all the way down", "Wed, Nov 4"), topics=["angular"], desc="Deep dives and lightning talks for Angular teams, hosted at MaRS."),
    dict(name="React Toronto", ini="RT", city="Toronto", members=4310, next=("Server Components, one year in", "Mon, Nov 9"), topics=["react"], desc="React, Next.js and front-end performance talks from teams shipping in production."),
    dict(name="AWS User Group Toronto", ini="AW", city="Toronto", members=2870, next=("Bedrock in the real world", "Thu, Nov 5"), topics=["aws", "ai"], desc="Short talks from local teams building on AWS, plus re:Invent watch parties."),
    dict(name="Azure Toronto", ini="AZ", city="Toronto", members=1260, next=("Landing zones that don't hurt", "Wed, Nov 11"), topics=["azure"], desc="Infrastructure-as-code, governance and platform engineering on Azure."),
    dict(name="AI Builders GTA", ini="AI", city="Markham", members=1780, next=("GTA AI Builders Hackathon", "Sat, Nov 7"), topics=["ai"], desc="Hands-on nights and hackathons for people building with open and hosted models."),
    dict(name="Women in AI Toronto", ini="WA", city="Toronto", members=2050, next=("RAG evaluation workshop", "Tue, Nov 10"), topics=["ai"], desc="Workshops, mentorship and talks led by women working in AI and data."),
    dict(name="Brampton Dev Night", ini="BD", city="Brampton", members=640, next=("Blazor vs Angular: a friendly fight", "Thu, Nov 12"), topics=["dotnet", "angular"], desc="A friendly monthly dev night in the Brampton Innovation District."),
    dict(name="Microsoft Reactor", ini="MR", city="Streaming", members=18400, next=("Azure AI Foundry: shipping agents to production", "Wed, Nov 4"), topics=["ai", "azure"], desc="Global livestreams from Microsoft product teams and cloud advocates."),
]


def community_card(c, hover=False):
    who = "followers" if c["city"] == "Streaming" else "members"
    return (f'<li><article class="dir-card"{HOVER if hover else ""}><div class="dir-card__head"><span class="logo-tile" aria-hidden="true">{c["ini"]}</span>'
            f'<div><h2 class="dir-card__title"><a href="{P("community-detail")}">{esc(c["name"])}</a></h2>'
            f'<p class="dir-card__sub">{c["city"]} · {c["members"]:,} {who}</p></div></div>'
            f'<p class="dir-card__desc">{esc(c["desc"])}</p>'
            f'<div class="dir-card__foot"><span class="meta-item">{icon("calendar")}Next: {esc(c["next"][0])} · {c["next"][1]}</span>{tags(c["topics"])}</div></article></li>')


def communities_page(content, q="", topic="All topics", city="All of the GTA", lead="86 meetups and conferences across Toronto and the GTA, plus the global streams we list."):
    sel = (select("comm-topic", "Topic", ["All topics"] + [t for _, t in TOPICS], topic) +
           select("comm-city", "City", ["All of the GTA", "Toronto", "Mississauga", "Brampton", "Markham", "Oakville", "Streaming"], city) +
           select("comm-sort", "Sort by", ["Most members", "Next event soonest", "A–Z"]))
    main = title_block("Communities", lead) + toolbar("comm-search", "Search communities", "Search groups by name or topic", q, sel) + content
    return shell(main, "communities")


screen("communities", "page", "Communities", route="/communities")


@state("communities", "default", "Directory of GTA tech communities: name, city, size, next event and topics, with search, filters and sort.")
def _():
    grid = '<ul class="card-grid">' + "".join(community_card(c, i == 0) for i, c in enumerate(COMMUNITIES)) + "</ul>"
    more = f'<div class="load-more"><p class="text-caption">Showing 10 of 86 communities</p><button class="btn" type="button">Show 20 more</button></div>'
    return communities_page(grid + more) + note("The whole card is the link; hover and keyboard focus lift it. Filters update the URL so a filtered list can be shared.", "top: 18rem; right: 1rem;")


@state("communities", "loading", "Skeleton cards in the same grid while the directory loads.")
def _():
    return communities_page('<p class="result-line" role="status">Loading communities…</p>' + skeleton_cards(), lead="Loading communities…")


@state("communities", "empty", "Oakville has no listed communities yet; invites someone to list theirs.")
def _():
    return communities_page(empty("users", "No communities in Oakville yet",
                                  "Nobody has listed an Oakville meetup. If you run one, add your next event and your group gets a page here.",
                                  f'<a class="btn btn--primary" href="{P("submit-event")}">{icon("plus")}List your community</a><a class="btn" href="{P("communities")}">See all of the GTA</a>'),
                            city="Oakville", lead="0 communities in Oakville.")


@state("communities", "error", "The directory failed to load; search and filters stay, with a retry.")
def _():
    return communities_page('<div style="margin-top: var(--space-6);">' + alert("danger", "We couldn't load communities", "6ixstack didn't respond in time. Your search and filters are kept.",
                                                                                f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button>', role="alert") + "</div>",
                            lead="Community list unavailable right now.")


@state("communities", "no-results", "Search for “Rust” matches no group; suggests clearing or submitting one.")
def _():
    return communities_page(empty("search-x", "No communities match “Rust”", "Try a broader search, or clear the topic and city filters.",
                                  f'<a class="btn btn--primary" href="{P("communities")}">Clear search</a><a class="btn" href="{P("submit-event")}">List a Rust meetup</a>'),
                            q="Rust", lead="0 of 86 communities match.")


# ======================================================================= community detail
FABRIC = dict(id="gtaac-fabric-pbi", title="Fabric for Power BI developers", org="GTA Azure Community", desc="Moving Power BI reports onto Fabric semantic models, with a live migration.",
              topics=["azure"], fmt="in-person", date="2026-11-18", dow="Wednesday", md="November 18", start="6:30 PM", end="8:30 PM",
              venue="Sheridan College, Hazel McCallion Campus", city="Mississauga", price="Free", going=74)
PAST_GTAAC = [("Copilot Studio for pro developers", "Oct 21, 2026", 96), ("Azure Container Apps in production", "Sep 16, 2026", 112), ("Summer social at Port Credit", "Aug 19, 2026", 58)]


def past_list(items):
    lis = "".join(f'<li class="list__item"><div class="list__body"><div class="list__title">{esc(t)}</div><div class="list__meta">{d} · {n} attended</div></div>'
                  f'<a class="btn btn--ghost btn--sm" href="{P("event-detail", "past")}">Recap</a></li>' for t, d, n in items)
    return f'<ul class="list" style="border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); background: var(--color-bg-surface);">{lis}</ul>'


def section(hid, title, inner):
    return f'<section aria-labelledby="{hid}"><h2 id="{hid}" style="font: var(--text-h4); margin-bottom: var(--space-4);">{title}</h2>{inner}</section>'


def comm_aside():
    org = "".join(f'<li><a class="person" href="{P("speaker-detail")}"><span class="avatar avatar--sm" aria-hidden="true">{i}</span><span><span class="person__name">{n}</span><br><span class="person__role">{r}</span></span></a></li>'
                  for n, i, r in [("Priya Natarajan", "PN", "Lead organizer"), ("Marcus Bell", "MB", "Co-organizer"), ("Nadia Chen", "NC", "Volunteer, labs")])
    return (f'<aside class="stack" aria-label="About the group"><div class="facts">'
            f'{fact_row("users", "2,140 members", "Monthly since 2019")}{fact_row("pin", "Mississauga and online", "Living Arts Centre, Sheridan College")}'
            f'{fact_row("globe", "gtaazure.ca", GA_LINKS)}</div>'
            f'<a class="btn btn--primary btn--block" href="{D("subscribe-feed")}">{icon("rss")}Subscribe to this group</a>'
            f'<section aria-labelledby="org-h"><h2 id="org-h" style="font: var(--text-label); margin-bottom: var(--space-3);">Organizers</h2><ul class="stack stack--sm" style="list-style: none; padding: 0;">{org}</ul></section></aside>')


GA_LINKS = '<a href="https://gtaazure.ca">Website</a> · <a href="https://www.meetup.com/gta-azure">Meetup</a> · <a href="https://www.linkedin.com/company/gtaazure">LinkedIn</a>'
PN_LINKS = '<a href="https://priya.dev">priya.dev</a> · <a href="https://www.linkedin.com/in/priyanatarajan">LinkedIn</a> · <a href="https://github.com/priyan">GitHub</a>'


def fact_row(ic, label, value):
    return f'<div class="fact">{icon(ic)}<div><div class="fact__label">{label}</div><div class="fact__value">{value}</div></div></div>'


def comm_head():
    return (f'<a class="back-link" href="{P("communities")}">{icon("arrow-left", "icon icon--sm")}All communities</a>'
            f'<div class="detail-hero"><span class="logo-tile logo-tile--lg" aria-hidden="true">GA</span><div><h1>GTA Azure Community</h1>'
            f'<p class="lead">Azure, data and AI in Mississauga and Peel, run by local MVPs.</p><div class="chip-row">{tags(["azure", "ai"])}</div></div></div>')


def comm_page(upcoming):
    about = section("about-h", "About", '<div class="prose"><p>We meet on the third Wednesday of every month for two talks, food and a lot of questions. Once a year we run Azure Data &amp; AI Day, a full day of sessions and labs at the Living Arts Centre.</p><p>Talks are recorded and posted to our YouTube channel within a week. New speakers are welcome — we pair first-timers with a mentor.</p></div>')
    main = (f'{comm_head()}<div class="page-grid"><div class="stack-gap" style="min-width: 0;">{about}'
            f'{section("up-h", "Upcoming events", upcoming)}{section("past-h", "Past events", past_list(PAST_GTAAC))}</div>{comm_aside()}</div>')
    return shell(main, "communities")


screen("community-detail", "page", "Community detail", route="/communities/:id")


@state("community-detail", "default", "GTA Azure Community: about, upcoming events, past events with recaps, organizers and links.")
def _():
    return comm_page(day_groups([EV["azure-data-ai-day"], FABRIC]).replace('class="day-group"', 'class="day-group" style="margin-top: 0;"', 1))


@state("community-detail", "loading", "Group header and sections render as skeletons matching the loaded layout.")
def _():
    facts = "".join(f'<div class="fact">{sk("1.25rem", "1.25rem", "skeleton--rect")}<div>{sk("70%", "1rem")}{sk("50%", "0.85rem")}</div></div>' for _ in range(3))
    main = (f'<a class="back-link" href="{P("communities")}">{icon("arrow-left", "icon icon--sm")}All communities</a>'
            f'<div class="detail-hero">{sk("4.5rem", "4.5rem", "skeleton--rect")}<div style="flex: 1;"><h1><span class="visually-hidden">Loading community</span>{sk("60%", "2.4rem", "skeleton--title")}</h1>{sk("45%", "1.1rem")}</div></div>'
            f'<div class="page-grid"><div class="stack-gap" aria-hidden="true"><div>{sk("20%", "1.4rem")}{sk("100%")}{sk("90%")}</div>'
            f'<div>{sk("30%", "1.4rem")}<ul class="event-list">{skeleton_rows(2)}</ul></div></div>'
            f'<aside class="stack" aria-label="About the group" aria-busy="true"><div class="facts">{facts}</div>{sk("100%", "2.5rem", "skeleton--rect")}</aside></div>')
    return shell(main, "communities")


@state("community-detail", "empty", "No upcoming events: says when the group usually posts and offers to subscribe.")
def _():
    return comm_page(empty("calendar", "Nothing scheduled right now",
                           "GTA Azure Community usually posts its next meetup about three weeks ahead. Subscribe and it lands in your calendar as soon as it's listed.",
                           f'<a class="btn btn--primary" href="{D("subscribe-feed")}">{icon("rss")}Subscribe to this group</a>', compact=True, heading="h3"))


@state("community-detail", "error", "The group failed to load: retry plus a way back to the directory.")
def _():
    main = (f'<a class="back-link" href="{P("communities")}">{icon("arrow-left", "icon icon--sm")}All communities</a>' + empty(
        "alert", "This community didn't load", "We couldn't reach 6ixstack. Check your connection and try again.",
        f'<button class="btn btn--primary" type="button">{icon("refresh")}Try again</button><a class="btn" href="{P("communities")}">Back to communities</a>', error=True, heading="h1"))
    return shell(main, "communities")


# ======================================================================= speakers
SPEAKERS = [
    dict(name="Priya Natarajan", ini="PN", role="Azure MVP · Cloud architect, Rogers", topics=["azure", "ai"], next=("Keynote: Fabric one year later", "Thu, Nov 5")),
    dict(name="Marcus Bell", ini="MB", role="Data platform lead, Scotiabank", topics=["azure", "ai"], next=("Panel: data teams in Canadian banks", "Thu, Nov 5")),
    dict(name="Aisha Rahman", ini="AR", role="Senior PM, Microsoft Fabric", topics=["azure", "ai"], next=("Grounding Azure OpenAI on your lakehouse", "Thu, Nov 5")),
    dict(name="Kenji Watanabe", ini="KW", role="Solutions architect, Shopify", topics=["aws", "react"], next=("Panel: data teams in Canadian banks", "Thu, Nov 5")),
    dict(name="Sofia Marchetti", ini="SM", role="Cloud advocate, Microsoft", topics=["ai", "azure"], next=("Azure AI Foundry: shipping agents to production", "Wed, Nov 4")),
    dict(name="Daniel Okafor", ini="DO", role="Principal PM, Azure AI Foundry", topics=["ai"], next=("Azure AI Foundry: shipping agents to production", "Wed, Nov 4")),
    dict(name="Leila Haddad", ini="LH", role="Staff engineer, Wealthsimple", topics=["angular"], next=("Signals all the way down", "Wed, Nov 4")),
    dict(name="Tomás Rivera", ini="TR", role="Frontend lead, Ada Support", topics=["react"], next=("Server Components, one year in", "Mon, Nov 9")),
    dict(name="Nadia Chen", ini="NC", role="ML engineer, Cohere", topics=["ai"], next=("RAG evaluation workshop", "Tue, Nov 10")),
]


def speaker_card(s, hover=False):
    return (f'<li><article class="dir-card"{HOVER if hover else ""}><div class="dir-card__head"><span class="avatar" aria-hidden="true">{s["ini"]}</span>'
            f'<div><h2 class="dir-card__title"><a href="{P("speaker-detail")}">{esc(s["name"])}</a></h2><p class="dir-card__sub">{esc(s["role"])}</p></div></div>'
            f'<div class="chip-row">{tags(s["topics"])}</div>'
            f'<div class="dir-card__foot"><span class="meta-item">{icon("mic")}Next: {esc(s["next"][0])} · {s["next"][1]}</span></div></article></li>')


def speakers_page(content, q="", topic="All topics", when="Any time", lead="214 people who have spoken at GTA meetups and conferences this year."):
    sel = (select("spk-topic", "Topic", ["All topics"] + [t for _, t in TOPICS], topic) +
           select("spk-when", "Speaking", ["Any time", "Speaking this month", "Spoke this year"], when))
    main = title_block("Speakers", lead) + toolbar("spk-search", "Search speakers", "Search by name, company or talk", q, sel) + content
    return shell(main, "speakers")


screen("speakers", "page", "Speakers", route="/speakers")


@state("speakers", "default", "Speaker directory: avatar, role, topics and next talk, with search and filters.")
def _():
    grid = '<ul class="card-grid">' + "".join(speaker_card(s, i == 0) for i, s in enumerate(SPEAKERS)) + "</ul>"
    return speakers_page(grid + '<div class="load-more"><p class="text-caption">Showing 9 of 214 speakers</p><button class="btn" type="button">Show 24 more</button></div>')


@state("speakers", "loading", "Skeleton speaker cards while the directory loads.")
def _():
    return speakers_page('<p class="result-line" role="status">Loading speakers…</p>' + skeleton_cards(), lead="Loading speakers…")


@state("speakers", "empty", "Nobody is speaking about AWS this month; suggests widening the date or pitching a talk.")
def _():
    return speakers_page(empty("mic", "No AWS talks this month",
                               "Nobody is listed to speak about AWS before November 30. AWS User Group Toronto is looking for speakers for December.",
                               f'<a class="btn btn--primary" href="{P("speakers")}">Show any time</a><a class="btn" href="{P("community-detail")}">Pitch a talk</a>'),
                         topic="AWS", when="Speaking this month", lead="0 speakers match.")


@state("speakers", "error", "The speaker list failed to load; filters stay, with a retry.")
def _():
    return speakers_page('<div style="margin-top: var(--space-6);">' + alert("danger", "We couldn't load speakers", "6ixstack didn't respond in time. Your search and filters are kept.",
                                                                              f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button>', role="alert") + "</div>",
                         lead="Speaker list unavailable right now.")


@state("speakers", "no-results", "Search for “Kotlin” finds nobody; offers to clear the search.")
def _():
    return speakers_page(empty("search-x", "No speakers match “Kotlin”", "Check the spelling, or search by company or talk title instead.",
                               f'<a class="btn btn--primary" href="{P("speakers")}">Clear search</a>'), q="Kotlin", lead="0 of 214 speakers match.")


# ======================================================================= speaker detail
screen("speaker-detail", "page", "Speaker detail", route="/speakers/:id")
PAST_TALKS = [("Copilot Studio for pro developers", "GTA Azure Community · Oct 21, 2026"), ("Landing zones for small teams", "Azure Toronto · Jun 10, 2026"), ("Fabric in 45 minutes", "Global Azure Toronto · Apr 18, 2026")]


def speaker_page(upcoming):
    head = (f'<a class="back-link" href="{P("speakers")}">{icon("arrow-left", "icon icon--sm")}All speakers</a>'
            f'<div class="detail-hero"><span class="avatar avatar--xl" aria-hidden="true">PN</span><div><h1>Priya Natarajan</h1>'
            f'<p class="lead">Azure MVP · Cloud architect at Rogers · Lead organizer of <a href="{P("community-detail")}">GTA Azure Community</a></p>'
            f'<div class="chip-row">{tags(["azure", "ai"])}</div></div></div>')
    bio = section("bio-h", "About", '<div class="prose"><p>Priya designs data platforms on Azure for Rogers and has spoken at more than forty GTA meetups since 2019. She runs GTA Azure Community and mentors first-time speakers.</p><p>Talks usually cover Microsoft Fabric, Azure OpenAI and keeping cloud bills sane.</p></div>')
    past = "".join(f'<li class="list__item"><div class="list__body"><div class="list__title">{esc(t)}</div><div class="list__meta">{w}</div></div>'
                   f'<a class="btn btn--ghost btn--sm" href="{P("event-detail", "past")}">Recording</a></li>' for t, w in PAST_TALKS)
    past = f'<ul class="list" style="border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); background: var(--color-bg-surface);">{past}</ul>'
    aside = (f'<aside class="stack" aria-label="Links"><div class="facts">{fact_row("mic", "43 talks", "Since 2019")}{fact_row("pin", "Mississauga", "Speaks in person across the GTA")}'
             f'{fact_row("globe", "Links", PN_LINKS)}</div>'
             f'<a class="btn btn--primary btn--block" href="mailto:priya@gtaazure.ca">{icon("mail")}Invite to speak</a></aside>')
    main = f'{head}<div class="page-grid"><div class="stack-gap" style="min-width: 0;">{bio}{section("up-h", "Upcoming talks", upcoming)}{section("past-h", "Past talks", past)}</div>{aside}</div>'
    return shell(main, "speakers")


@state("speaker-detail", "default", "Priya Natarajan: bio, upcoming keynote at Azure Data & AI Day, past talks with recordings, links.")
def _():
    kw = dict(EV["azure-data-ai-day"], title="Keynote: Fabric one year later", org="Azure Data & AI Day GTA · GTA Azure Community", start="9:30 AM")
    return speaker_page(f'<ul class="event-list"><li>{event_row(kw, href=P("event-detail"))}</li><li>{event_row(FABRIC, href=P("event-detail"))}</li></ul>')


@state("speaker-detail", "loading", "Speaker profile skeleton matching the loaded layout.")
def _():
    main = (f'<a class="back-link" href="{P("speakers")}">{icon("arrow-left", "icon icon--sm")}All speakers</a>'
            f'<div class="detail-hero">{sk("5rem", "5rem", "skeleton--circle")}<div style="flex: 1;"><h1><span class="visually-hidden">Loading speaker</span>{sk("50%", "2.4rem", "skeleton--title")}</h1>{sk("70%", "1.1rem")}</div></div>'
            f'<div class="page-grid"><div class="stack-gap" aria-hidden="true"><div>{sk("20%", "1.4rem")}{sk("100%")}{sk("85%")}</div><div>{sk("30%", "1.4rem")}<ul class="event-list">{skeleton_rows(2)}</ul></div></div>'
            f'<aside class="stack" aria-label="Links" aria-busy="true">{sk("100%", "9rem", "skeleton--rect")}{sk("100%", "2.5rem", "skeleton--rect")}</aside></div>')
    return shell(main, "speakers")


@state("speaker-detail", "empty", "No upcoming talks: past talks remain and the invite action is offered.")
def _():
    return speaker_page(empty("mic", "No upcoming talks", "Priya isn't scheduled to speak anywhere right now. Organizers can invite her directly.",
                              '<a class="btn btn--primary" href="mailto:priya@gtaazure.ca">Invite to speak</a>', compact=True, heading="h3"))


@state("speaker-detail", "error", "Profile failed to load: retry and a way back.")
def _():
    main = (f'<a class="back-link" href="{P("speakers")}">{icon("arrow-left", "icon icon--sm")}All speakers</a>' + empty(
        "alert", "This profile didn't load", "We couldn't reach 6ixstack. Check your connection and try again.",
        f'<button class="btn btn--primary" type="button">{icon("refresh")}Try again</button><a class="btn" href="{P("speakers")}">Back to speakers</a>', error=True, heading="h1"))
    return shell(main, "speakers")


# ======================================================================= calendar feeds
screen("calendar-feeds", "page", "Calendar feeds", route="/feeds", na={"empty": "Ready-made feeds always exist."})
READY = [("Everything", "All GTA and streaming events", 14, "all"), ("In the GTA", "In-person and hybrid events only", 9, "gta"), ("Streaming", "Online talks you can watch from anywhere", 7, "streaming"),
         ("AI", "Every AI event, local or streamed", 6, "ai"), (".NET", ".NET and C# events", 4, "dotnet"), ("Azure", "Azure and Fabric events", 4, "azure")]


def ready_list(skeleton=False):
    lis = ""
    for i, (t, d, n, slug) in enumerate(READY):
        count = sk("4rem", "0.85rem") if skeleton else f"{d} · {n} in the next two weeks"
        lis += (f'<li class="list__item"><span class="logo-tile" aria-hidden="true">{icon("rss")}</span><div class="list__body"><div class="list__title">{t}</div><div class="list__meta">{count}</div></div>'
                f'<a class="btn btn--sm" href="{N("app-toast", "success")}" aria-label="Copy the {t} feed link">{icon("copy")}Copy link</a></li>')
    return f'<ul class="list" style="border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); background: var(--color-bg-surface);">{lis}</ul>'


def builder(done=False):
    if done:
        url = "webcal://6ixstack.dev/feeds/ai-azure-gta-stream.ics"
        inner = (f'<div class="success-panel"><div class="success-panel__icon">{icon("check-circle", "icon icon--lg")}</div>'
                 f'<div><h3 style="font: var(--text-h4);">Your feed is ready</h3><p class="text-muted">AI and Azure events, in the GTA and streaming. 10 events right now; new ones appear on their own.</p></div>'
                 f'<div class="field" style="width: 100%;"><label class="field__label" for="feed-url">Feed link</label><div class="copy-field"><input class="input" id="feed-url" readonly value="{url}">'
                 f'<a class="btn" href="{N("app-toast", "success")}">{icon("copy")}Copy</a></div></div>'
                 f'<ul class="option-list" style="width: 100%;"><li><a class="option-btn" href="https://calendar.google.com/calendar/r?cid={url}">{icon("calendar")}<span>Google Calendar</span>{icon("external")}</a></li>'
                 f'<li><a class="option-btn" href="https://outlook.live.com/calendar/addcalendar?url={url}">{icon("calendar")}<span>Outlook</span>{icon("external")}</a></li>'
                 f'<li><a class="option-btn" href="{url}">{icon("calendar")}<span>Apple Calendar</span>{icon("external")}</a></li></ul>'
                 f'<a class="btn btn--ghost" href="{P("calendar-feeds")}">Build another feed</a></div>')
        return f'<div class="form-card" role="status">{inner}</div>'
    boxes = "".join(f'<label class="choice"><input type="checkbox" name="topic" value="{k}"{" checked" if k in ("ai", "azure") else ""}><span class="choice__text"><span class="topic-tag" style="color: var(--color-fg-default);"><span class="topic-dot topic-dot--{k}" aria-hidden="true"></span>{t}</span></span></label>' for k, t in TOPICS)
    return (f'<form class="form-card" action="{P("calendar-feeds", "success")}"><fieldset><legend>Topics</legend><div class="form-grid form-grid--3" style="margin-top: 0; gap: var(--space-2);">{boxes}</div></fieldset>'
            f'<fieldset style="margin-top: var(--space-5);"><legend>Where</legend><div class="choice-row">'
            f'<label class="choice"><input type="radio" name="where" checked><span class="choice__text">GTA and streaming</span></label>'
            f'<label class="choice"><input type="radio" name="where"><span class="choice__text">GTA only</span></label>'
            f'<label class="choice"><input type="radio" name="where"><span class="choice__text">Streaming only</span></label></div></fieldset>'
            f'<div class="form-actions"><button class="btn btn--primary" type="submit">Create feed link</button></div></form>')


def how_it_works():
    return ('<ol class="steps-next"><li><span><strong>Pick a feed</strong> — a ready-made one or your own mix of topics.</span></li>'
            '<li><span><strong>Add it once</strong> to Google Calendar, Outlook or Apple Calendar.</span></li>'
            '<li><span><strong>Stop checking.</strong> New and changed events show up on their own, in Toronto time.</span></li></ol>')


def feeds_page(ready, build_html):
    main = (title_block("Calendar feeds", "Subscribe once and every event you care about shows up in your own calendar.") +
            f'<div class="page-grid"><div class="stack-gap" style="min-width: 0;">{section("ready-h", "Ready-made feeds", ready)}{section("build-h", "Build your own", build_html)}</div>'
            f'<aside class="stack" aria-label="How feeds work">{section("how-h", "How it works", how_it_works())}'
            f'<p class="text-caption">Feeds are public links with no account needed. Calendar apps refresh them every 2–12 hours.</p></aside></div>')
    return shell(main)


@state("calendar-feeds", "default", "Ready-made feeds with copy buttons, a custom feed builder, and how subscribing works.")
def _():
    return feeds_page(ready_list(), builder())


@state("calendar-feeds", "loading", "Feed counts load as skeletons; the builder is usable immediately.")
def _():
    return feeds_page(ready_list(skeleton=True), builder())


@state("calendar-feeds", "error", "Feed list failed to load; the builder still works and a retry is offered.")
def _():
    return feeds_page(alert("danger", "We couldn't load the ready-made feeds", "You can still build your own feed below.", '<button type="button">Try again</button>', role="alert"), builder())


@state("calendar-feeds", "success", "Custom feed created: the link with copy and one-click Google, Outlook and Apple options.")
def _():
    return feeds_page(ready_list(), builder(done=True))


# ======================================================================= about / code of conduct
screen("about", "page", "About", route="/about", na=STATIC_NA)


@state("about", "default", "What 6ixstack is, how listings are reviewed, who runs it, and how to help.")
def _():
    stats = ('<div class="stats-row">' + "".join(f'<div class="stat"><span class="stat__label">{l}</span><span class="stat__value">{v}</span></div>'
                                              for l, v in [("Communities", "86"), ("Events listed in 2026", "1,240"), ("Feed subscribers", "9,800"), ("Volunteer moderators", "6")]) + "</div>")
    prose = ('<div class="prose"><p>6ixstack is one calendar for every developer event in Toronto and the GTA, plus the global talks you can stream. It started in 2025 because finding a good meetup meant checking a dozen Meetup groups, LinkedIn posts and Discord servers.</p>'
             '<h2>How listings work</h2><p>Anyone can submit an event for free. A volunteer moderator checks each one within a day: is it a real event, is it for developers, and are the date, time and venue right? Organizers can then edit their own listings.</p>'
             '<h2>What we don’t do</h2><ul><li>We never sell tickets or charge attendees.</li><li>We don’t track you across sites; there are no ad cookies.</li><li>We don’t rank events by who pays.</li></ul>'
             f'<h2>Who runs it</h2><p>A small group of volunteers from the GTA developer community, led by Jordan Lee. Questions or ideas? <a href="{P("contact")}">Get in touch</a>.</p></div>')
    main = title_block("About 6ixstack", "Made in Toronto, for the people building in the 6ix.") + stats + f'<div class="page--narrow" style="padding: 0; margin: 0;">{prose}</div>'
    return shell(main)


screen("code-of-conduct", "page", "Code of conduct", route="/code-of-conduct", na=STATIC_NA)


@state("code-of-conduct", "default", "Community code of conduct for listed events, with how to report and what happens next.")
def _():
    prose = ('<div class="prose"><p>Every event listed on 6ixstack agrees to provide a harassment-free experience for everyone, regardless of gender, gender identity, sexual orientation, disability, appearance, body size, race, ethnicity, age, religion or nationality.</p>'
             '<h2>Expected behaviour</h2><ul><li>Be welcoming to people who are new to the community or to tech.</li><li>Respect the speaker and the audience; heckling is not debate.</li><li>Ask before photographing or recording people.</li></ul>'
             '<h2>Not acceptable</h2><ul><li>Harassment, intimidation or discrimination in any form.</li><li>Sexual language or imagery in talks, slides or chat.</li><li>Sustained disruption of talks or events.</li></ul>'
             '<h2>Reporting</h2>'
             f'<p>Email <a href="mailto:conduct@6ixstack.dev">conduct@6ixstack.dev</a> or choose “Code of conduct concern” under <a href="{D("report-event")}">Report a problem</a> on any event page. Reports go to two moderators, never to the event organizer, and we reply within 24 hours.</p>'
             '<h2>What happens next</h2><p>We talk to the people involved, decide on a response — from a warning to removing a group’s listings — and tell you what we did. Organizers who ignore this code lose the ability to list events.</p>'
             '<p class="text-muted">Last updated September 1, 2026.</p></div>')
    main = title_block("Code of conduct", "Applies to every event listed on 6ixstack, in person and online.") + f'<div class="page--narrow" style="padding: 0; margin: 0;">{prose}</div>'
    return shell(main)


# ======================================================================= contact
screen("contact", "page", "Contact", route="/contact",
       na={"loading": "The form is static; nothing loads before it can be used.", "empty": "A contact form has no collection."})
VALID = dict(name="Priya Natarajan", email="priya@gtaazure.ca", topic="Listing correction", msg="Our November meetup moved from Living Arts Centre to Sheridan College. Could you update the venue on Fabric for Power BI developers?")


def contact_form(v=None, errors=None, disabled=False, busy=False):
    v = v or {}
    errors = errors or {}
    def ctl(fid, key, kind="input"):
        bad = key in errors
        desc = f' aria-describedby="{fid}-error"' if bad else ""
        iv = ' aria-invalid="true"' if bad else ""
        if kind == "textarea":
            return f'<textarea class="textarea" id="{fid}" name="{fid}" rows="5"{iv}{desc}>{esc(v.get(key, ""))}</textarea>'
        typ = "email" if key == "email" else "text"
        val = f' value="{esc(v.get(key, ""))}"' if v.get(key) else ""
        auto = ' autocomplete="email"' if key == "email" else ' autocomplete="name"'
        return f'<input class="input" id="{fid}" name="{fid}" type="{typ}"{val}{iv}{desc}{auto}>'
    topics = "".join(f'<option{" selected" if o == v.get("topic") else ""}>{o}</option>' for o in ["General question", "Listing correction", "Partnership or sponsorship", "Code of conduct report", "Press"])
    summary = ""
    if errors:
        lis = "".join(f'<li><a href="#contact-{k}">{m}</a></li>' for k, m in errors.items())
        summary = (f'<div class="alert alert--danger form-summary" role="alert" tabindex="-1" id="error-summary">{icon("alert")}<div class="alert__body">'
                   f'<p class="alert__title">Fix {len(errors)} thing{"s" if len(errors) > 1 else ""} before sending</p><ul>{lis}</ul></div></div>')
    b = ' aria-busy="true"' if busy else ""
    return (f'{summary}<form class="form-card" action="{P("contact", "success")}" novalidate><fieldset{" disabled" if disabled else ""}><div class="form-grid form-grid--2" style="margin-top: 0;">'
            f'{field("Your name", ctl("contact-name", "name"), error=errors.get("name", ""), fid="contact-name")}'
            f'{field("Email", ctl("contact-email", "email"), error=errors.get("email", ""), fid="contact-email")}'
            f'<div class="span-2">{topic_field(topics)}</div>'
            f'<div class="span-2">{field("Message", ctl("contact-message", "msg", "textarea"), error=errors.get("msg", ""), fid="contact-message")}</div></div></fieldset>'
            f'<div class="form-actions"><button class="btn btn--primary" type="submit"{b}{" disabled" if disabled and not busy else ""}>{"Sending…" if busy else "Send message"}</button></div></form>')


def topic_field(opts):
    return field("What is it about?", f'<select class="select" id="contact-topic" name="contact-topic">{opts}</select>', fid="contact-topic")


def contact_page(inner):
    aside = (f'<aside class="stack" aria-label="Other ways to reach us"><div class="facts">{fact_row("mail", "hello@6ixstack.dev", "We reply within two working days")}'
             f'{fact_row("shield", "conduct@6ixstack.dev", "Code of conduct reports, answered within 24 hours")}'
             f'{fact_row("flag", "Wrong event details?", "Use Report a problem on the event page for the fastest fix")}</div></aside>')
    main = title_block("Contact", "Questions, corrections or ideas — a person reads every message.") + f'<div class="page-grid"><div style="min-width: 0;">{inner}</div>{aside}</div>'
    return shell(main)


@state("contact", "default", "Contact form: name, email, topic and message, with the other ways to reach the team.")
def _():
    return contact_page(contact_form({"topic": "General question"}))


@state("contact", "invalid", "Sent with a bad email and no message: summary at the top linking to each field, inline errors.")
def _():
    v = dict(VALID, email="priya@gtaazure", msg="")
    errs = {"email": "Enter an email address like name@example.com", "msg": "Write a message so we know how to help"}
    return contact_page(contact_form(v, {"email": errs["email"], "msg": errs["msg"]})).replace('href="#contact-msg"', 'href="#contact-message"') + note("On submit, focus moves to the error summary; each item links to its field.", "top: 14rem; right: 1rem;")


@state("contact", "submitting", "Sending: fields read-only, button busy, no layout shift.")
def _():
    return contact_page(contact_form(VALID, disabled=True, busy=True))


@state("contact", "success", "Message sent: confirms where the reply goes and when.")
def _():
    inner = (f'<div class="form-card" role="status"><div class="success-panel"><div class="success-panel__icon">{icon("check-circle", "icon icon--lg")}</div>'
             f'<div><h2 style="font: var(--text-h3);">Thanks, Priya — message sent</h2><p class="text-muted" style="margin-top: var(--space-2);">We’ll reply to priya@gtaazure.ca within two working days. Listing corrections are usually fixed the same day.</p></div>'
             f'<div class="cluster"><a class="btn btn--primary" href="{P("events")}">Back to events</a><a class="btn" href="{P("contact")}">Send another message</a></div></div></div>')
    return contact_page(inner)


@state("contact", "error", "Sending failed: error at the top, everything typed is kept, retry.")
def _():
    return contact_page(alert("danger", "Your message didn't send", "6ixstack didn't respond. Nothing you wrote was lost — try again, or email hello@6ixstack.dev.", role="alert") +
                        '<div style="margin-top: var(--space-4);"></div>' + contact_form(VALID).replace("Send message", "Try again"))


# ======================================================================= status pages
def status_page(code_html, h1, text, actions, user=None):
    main = f'<div class="status-page"><div>{code_html}<h1>{h1}</h1><p>{text}</p><div class="empty__actions">{actions}</div></div></div>'
    return shell(main, user=user)


screen("not-found", "page", "Not found (404)", route="*", na=STATUS_NA)


@state("not-found", "default", "Unknown or removed URL: explains, offers search and the way home.")
def _():
    return status_page('<div class="status-page__code" aria-hidden="true">404<span>.</span></div>', "We can't find that page",
                       "The event may have been removed by its organizer, or the link has a typo. Search for it or browse what's on.",
                       f'<a class="btn btn--primary" href="{P("events")}">Browse events</a><a class="btn" href="{P("calendar")}">Open the calendar</a>')


screen("forbidden", "page", "Forbidden (403)", route="/organize/events/:id/edit", na=STATUS_NA)


@state("forbidden", "default", "Organizer opened another group's event: says who owns it, who to ask, and how to switch accounts.")
def _():
    return status_page('<div class="status-page__code" aria-hidden="true">403<span>.</span></div>', "You can't edit this event",
                       "“Landing zones that don't hurt” is managed by Azure Toronto. You're signed in as priya@gtaazure.ca for GTA Azure Community. Ask an Azure Toronto organizer to add you, or sign in with another account.",
                       f'<a class="btn btn--primary" href="{P("organizer-dashboard")}">Back to your events</a><a class="btn" href="{P("sign-in")}">Use another account</a><a class="btn btn--ghost" href="{P("contact")}">Contact us</a>',
                       user="organizer")


screen("server-error", "page", "Server error (500)", route="*", na=STATUS_NA)


@state("server-error", "default", "Unexpected server failure: apology, retry, and a reference code for support.")
def _():
    return status_page('<div class="status-page__code" aria-hidden="true">500<span>.</span></div>', "Something broke on our side",
                       "It's not you. We've been notified and are looking into it. If it keeps happening, email hello@6ixstack.dev and mention Ref 7F3A-21C9.",
                       f'<button class="btn btn--primary" type="button">{icon("refresh")}Try again</button><a class="btn" href="{P("events")}">Go to events</a>')


screen("offline", "page", "Offline", route="*", na=STATUS_NA)


@state("offline", "default", "No connection and the page isn't cached: says so and points to saved events.")
def _():
    code = f'<div class="empty__icon" style="margin: 0 auto;">{icon("wifi-off", "icon icon--lg")}</div>'
    return status_page(code, "You're offline", "This page hasn't been saved on this device yet. The events list you last opened is available offline.",
                       f'<button class="btn btn--primary" type="button">{icon("refresh")}Try again</button><a class="btn" href="{N("site-banner", "warning")}">Open saved events</a>')
