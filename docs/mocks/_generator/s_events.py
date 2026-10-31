"""Events (home), event detail, calendar, and the dialogs/notifications that open from them.

Layout follows prototype v2: featured event beside the hero, search in the filter
row, the list beside a sticky "Where it's happening" map with a day timeline,
and the submit/subscribe calls to action in a band above the footer.
"""
from core import *
from mapviz import event_map, venue_map

WAIT = '<span class="badge badge--warning">Waitlist open</span>'
CANC = '<span class="badge badge--danger">Cancelled</span>'
STAT = '<p class="hero__stat"><strong>9 in the GTA</strong> and <strong>7 streamable</strong> over the next two weeks.</p>'

# ======================================================================= events (home)
screen("events", "page", "Events", route="/")


def hero(stat=None, feature=None):
    stat = stat if stat is not None else STAT
    feature = feature if feature is not None else feature_card()
    return (f'<section class="hero" aria-labelledby="hero-title"><div><h1 class="hero__title" id="hero-title">Every dev event in the 6ix<span class="hero__dot">.</span></h1>'
            f'<p class="hero__lead">Meetups and conferences across Toronto and the GTA, plus global talks you can stream. All in one calendar, in Toronto time.</p>{stat}</div>'
            f'<div>{feature}</div></section>')


def feature_skeleton():
    return (f'<div class="feature-card" aria-hidden="true">{sk("8rem", "0.9rem")}<div class="feature-card__head">{sk("3.75rem", "3.75rem", "skeleton--rect")}'
            f'<div style="flex: 1;">{sk("90%", "1.3rem")}{sk("60%", "0.9rem")}</div></div>{sk("100%", "0.9rem")}{sk("80%", "0.9rem")}'
            f'<div class="feature-card__foot">{sk("6rem", "1rem")}{sk("8rem", "2.5rem", "skeleton--rect")}</div></div>')


def search_box(query=""):
    v = f' value="{esc(query)}"' if query else ""
    return (f'<form class="search" role="search" action="{P("events", "no-results")}"><label class="visually-hidden" for="event-search">Search events</label>{icon("search")}'
            f'<input class="input" id="event-search" type="search" placeholder="Search talks, groups, or neighbourhoods"{v}></form>')


def filters(fmt="all", pressed=(), counts=(14, 9, 7), hover_chip=None, skeleton=False, query=None):
    segs = [("all", "All", counts[0]), ("gta", "In the GTA", counts[1]), ("streaming", "Streaming", counts[2])]
    sg = "".join(
        f'<button class="segmented__item" type="button" aria-pressed="{"true" if k == fmt else "false"}">{t} '
        f'<span class="segmented__count">{"–" if skeleton else c}</span></button>' for k, t, c in segs)
    chips = "".join(
        f'<button class="topic-chip" type="button" aria-pressed="{"true" if k in pressed else "false"}"{HOVER if k == hover_chip else ""}>'
        f'<span class="topic-dot topic-dot--{k}" aria-hidden="true"></span>{t}</button>' for k, t in TOPICS)
    seg = f'<div class="segmented" role="group" aria-label="Where">{sg}</div>'
    top = f'<div class="filter-row">{search_box(query)}{seg}</div>' if query is not None else seg
    return f'<div class="filter-bar">{top}<div class="chip-row" role="group" aria-label="Topics">{chips}</div></div>'


def result_line(text):
    return f'<p class="result-line" aria-live="polite">{text}</p>'


def cta_band():
    return (f'<div class="cta-band"><div class="cta-band__inner">'
            f'<section aria-labelledby="submit-title"><h2 id="submit-title">Running a meetup or conference?</h2>'
            f'<p>List it free and put it on the map. Local events and global streams are reviewed within a day.</p>'
            f'<a class="btn btn--primary" href="{P("submit-event")}">Submit an event{icon("arrow-right")}</a></section>'
            f'<section aria-labelledby="subscribe-title"><h2 id="subscribe-title">Never check back again</h2>'
            f'<p>Subscribe to a calendar feed that only shows the events you care about.</p>'
            f'<a class="arrow-link" href="{D("subscribe-feed")}">Get a calendar feed{icon("arrow-right")}</a></section></div></div>')


def events_page(content, map_html=None, feature=None, fmt="all", pressed=(), counts=(14, 9, 7), stat=None, query="", banner="", user=None, hover_chip=None, skeleton=False):
    map_html = map_html if map_html is not None else event_map(EVENTS)
    main = (f'{hero(stat, feature)}<div class="page-grid--map" id="events"><div style="min-width: 0;">'
            f'{filters(fmt, pressed, counts, hover_chip, skeleton, query)}{content}</div><div class="map-col">{map_html}</div></div>')
    return shell(main, "events", user=user, banner=banner, after_main=cta_band())


def map_notice(icon_name, text, action=""):
    a = f'<br><button type="button">{action}</button>' if action else ""
    return f'<div class="event-map__notice" role="status">{icon(icon_name, "icon icon--sm")}<div>{text}{a}</div></div>'


@state("events", "default", "Two weeks of GTA meetups and global streams by day, beside the live event map; hovering a row lights up its dot.")
def _():
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS),
                       event_map(EVENTS)) + note(
        "The map is live: comets ride each stream arc into Toronto every 3 s and every GTA dot ripples every 2.2 s. With reduced motion it shows a still frame. See “hover” for the row-to-map link.", "top: 44rem; left: 1rem;")


@state("events", "hover", "Hovering a row lights up its dot, dims the rest of the map and shows the event card; hovering a dot highlights the row.")
def _():
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS, hover_first=True),
                       event_map(EVENTS, hovered="tdnug-net11")) + note(
        "Hovering or focusing a row lifts its dot and shows a card on the map. Clicking a dot scrolls the list to that event (centred) and moves focus to it; with reduced motion the scroll jumps instead of gliding.", "top: 44rem; left: 1rem;")


@state("events", "day-focus", "A day picked on the map timeline: the map shows only Thursday, other days in the list dim and the day scrolls into view.")
def _():
    return events_page(result_line("14 events · times in ET · showing Thursday, November 5") + day_groups(EVENTS, focus_day="2026-11-05"),
                       event_map(EVENTS, focus_day="2026-11-05", hovered="azure-data-ai-day")) + note(
        "Choosing a day filters the map and dims the other days; on screens 1024 px and wider the list also scrolls to that day. Choosing it again, or “Show all dates”, clears the focus.", "top: 44rem; left: 1rem;")


@state("events", "playing", "“Play the next two weeks”: the timeline steps through each day with events while the map and list follow.")
def _():
    return events_page(result_line("14 events · times in ET · playing: Tuesday, November 10") + day_groups(EVENTS, focus_day="2026-11-10"),
                       event_map(EVENTS, focus_day="2026-11-10", playing=True)) + note(
        "Advances every 1.1 s through days that have events, then stops on the last one. Pause stops it; picking a day by hand also stops playback. Days without events are skipped and disabled.", "top: 44rem; left: 1rem;")


@state("events", "loading", "First load: hero copy is static; the featured card, list, counts and map show layout-matching skeletons.")
def _():
    stat = f'<p class="hero__stat">{sk("16rem", "1rem")}</p>'
    groups = "".join(
        f'<section class="day-group" aria-hidden="true"><div class="day-group__heading">{sk("10rem", "1.1rem")}</div><ul class="event-list">{skeleton_rows(n)}</ul></section>'
        for n in (1, 2))
    content = f'<p class="result-line" role="status">Loading events…</p>{groups}'
    m = event_map([], title="Where it’s happening", sub="Plotting events…", busy=True)
    return events_page(content, m, feature_skeleton(), stat=stat, skeleton=True) + note(
        "Skeletons appear only after 300 ms; rows keep the exact height of real rows, and the map frame keeps its size, so nothing shifts when data arrives.", "top: 44rem; left: 1rem;")


@state("events", "empty", "Nothing listed in the next two weeks (holiday lull): the list explains why, the map stays calm and empty.")
def _():
    content = result_line("0 events · times in ET") + empty(
        "calendar", "No events in the next two weeks",
        "It's a quiet stretch over the holidays. Organizers usually post January meetups in the first week of the new year.",
        f'<a class="btn btn--primary" href="{P("submit-event")}">{icon("plus")}Submit an event</a><a class="btn" href="{P("calendar", "empty")}">Browse the calendar</a>')
    stat = '<p class="hero__stat"><strong>0 in the GTA</strong> and <strong>0 streamable</strong> over the next two weeks.</p>'
    m = event_map([], overlay=map_notice("map", "Nothing on the map yet. New events appear here as soon as they're approved."))
    feat = (f'<section class="feature-card" aria-labelledby="featured-title"><p class="feature-card__label">Featured this week</p>'
            f'<h2 class="feature-card__title" id="featured-title" style="margin-top: var(--space-5);">Your event could be here</h2>'
            f'<p class="feature-card__desc">Each week we feature one GTA event with a hands-on track or a first-time speaker line-up.</p>'
            f'<div class="feature-card__foot"><span class="feature-card__when">Free to list</span><a class="btn btn--on-feature" href="{P("submit-event")}">Submit an event</a></div></section>')
    return events_page(content, m, feat, counts=(0, 0, 0), stat=stat)


@state("events", "error", "The events failed to load: chrome, filters and map frame stay, with retry and a way to calendar feeds.")
def _():
    content = f'<div style="margin-top: var(--space-6);">' + alert(
        "danger", "We couldn't load events", "6ixstack didn't respond in time. Your filters are kept; try again in a moment.",
        f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button><a href="{P("calendar-feeds")}">Use a calendar feed instead</a>', role="alert") + "</div>"
    stat = '<p class="hero__stat">Event counts are unavailable right now.</p>'
    m = event_map([], sub="Events unavailable", overlay=map_notice("alert", "The map fills in once events load."))
    return events_page(content, m, feature_skeleton(), stat=stat, counts=("–", "–", "–"))


@state("events", "filtered", "AI topic selected: six events match; counts, the list and the map update together.")
def _():
    ai = [e for e in EVENTS if "ai" in e["topics"]]
    content = result_line('6 events about AI · times in ET · <button class="btn btn--link btn--sm" type="button">Clear filters</button>') + day_groups(ai)
    return events_page(content, event_map(ai), pressed=("ai",), counts=(6, 4, 3), hover_chip="react")


@state("events", "no-results", "Search plus filters match nothing; the filters stay visible and one click clears them.")
def _():
    content = result_line("0 events · times in ET") + empty(
        "search-x", "No events match those filters", "Try another topic, or include streaming events.",
        f'<a class="btn btn--primary" href="{P("events")}">Clear filters</a><a class="btn" href="{D("subscribe-feed")}">Get a feed for Kubernetes</a>')
    return events_page(content, event_map([], sub="0 across the GTA · 0 streaming in"), fmt="gta", counts=(0, 0, 0), query="Kubernetes",
                       stat='<p class="hero__stat">No matches for <strong>“Kubernetes”</strong> in the next two weeks.</p>')


@state("events", "partial", "The list loaded but the map tiles failed; the list, filters and featured event keep working.")
def _():
    m = event_map([], title="Where it’s happening", sub="Map unavailable", timeline=True,
                  overlay=map_notice("alert", "The map didn't load. The list has every event.", "Try again"))
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS[:7]), m)


@state("events", "long", "Range widened to two months: 61 events with incremental loading; the map timeline still covers the next two weeks.")
def _():
    more = (f'<div class="load-more"><p class="text-caption">Showing 14 of 61 events through December 31</p>'
            f'<button class="btn" type="button">Show 20 more</button></div>')
    return events_page(result_line("61 events through Dec 31 · times in ET") + day_groups(EVENTS) + more,
                       counts=(61, 38, 29), stat='<p class="hero__stat"><strong>38 in the GTA</strong> and <strong>29 streamable</strong> through December 31.</p>')


@state("events", "edge", "Stress content: very long titles and venues, 5-digit attendance, every topic, sold out and cancelled rows.")
def _():
    long1 = dict(EV["azure-data-ai-day"], id="x1", title="Building trustworthy retrieval-augmented generation systems for regulated industries: evaluation, red-teaming and human review in Canadian financial services",
                 org="Toronto Machine Learning Society × Vector Institute × Women in AI Toronto", topics=["ai", "azure", "aws", "dotnet", "react", "angular"],
                 venue="Bahen Centre for Information Technology, Room 1180, 40 St. George Street", city="Toronto", going=12480, price="$1,250")
    sold = dict(EV["wai-rag-eval"], id="x2", price="Sold out")
    canc = dict(EV["brampton-blazor-angular"], id="x3", price="Cancelled")
    rows = (f'<section class="day-group" aria-labelledby="d-edge"><h2 class="day-group__heading" id="d-edge">Thursday <span>November 5</span></h2><ul class="event-list">'
            f'<li>{event_row(long1)}</li><li>{event_row(sold, extra_meta=WAIT)}</li>'
            f'<li>{event_row(canc, cls="event-row--cancelled", href=P("event-detail", "cancelled"), extra_meta=CANC)}</li></ul></section>')
    return events_page(result_line("3 events · times in ET") + rows)


# ======================================================================= event detail
screen("event-detail", "page", "Event detail", route="/events/:id",
       na={"empty": "An event always has content; an unknown or removed event shows the not-found page."})

SPEAKERS_DAY = [("Priya Natarajan", "PN", "Azure MVP · GTA Azure Community"), ("Marcus Bell", "MB", "Data platform lead, Scotiabank"),
                ("Aisha Rahman", "AR", "Microsoft Fabric team"), ("Kenji Watanabe", "KW", "Solutions architect, Shopify")]


def people(lst):
    return "<ul class=\"people\">" + "".join(
        f'<li><a class="person" href="{P("speaker-detail")}"><span class="avatar" aria-hidden="true">{i}</span><span><span class="person__name">{n}</span><br><span class="person__role">{r}</span></span></a></li>'
        for n, i, r in lst) + "</ul>"


def fact(ic, label, value):
    return f'<div class="fact">{icon(ic)}<div><div class="fact__label">{label}</div><div class="fact__value">{value}</div></div></div>'


def detail(e, *, h1, mon, day, org_line, facts, cta, body, banner="", inline="", cta_bar="", user=None):
    tags = "".join(topic_tag(t) for t in e["topics"])
    main = (f'<a class="back-link" href="{P("events")}">{icon("arrow-left", "icon icon--sm")}All events</a>'
            f'<div class="page-grid"><div style="min-width: 0;"><div class="detail-hero">{date_tile(mon, day, True)}<div>'
            f'<h1>{h1}</h1><p class="lead">{org_line}</p><div class="chip-row">{tags}</div></div></div>{inline}'
            f'<div class="stack-gap">{body}</div></div>'
            f'<aside class="stack" aria-label="Event details"><div class="facts">{facts}</div>{cta}</aside></div>')
    return shell(main, "events", banner=banner, after_main=cta_bar, user=user)


def day_facts():
    return (fact("calendar", "Thursday, November 5, 2026", '9:00 AM – 5:00 PM ET') +
            fact("pin", "Living Arts Centre", '4141 Living Arts Dr, Mississauga · <a href="https://maps.google.com/?q=Living+Arts+Centre">Directions</a>') +
            fact("radio", "Livestream available", "Keynote and main-stage sessions; labs are in person only") +
            fact("ticket", "$49 · includes lunch", "Student tickets $15 with a valid ID") +
            fact("users", "318 going", "Capacity 400"))


def day_cta(get="Get tickets · $49"):
    return (f'<div class="stack stack--sm"><a class="btn btn--primary btn--lg btn--block" href="https://tickets.example.org/azure-data-ai-day">{get}{icon("external")}</a>'
            f'<a class="btn btn--block" href="{D("add-to-calendar")}">{icon("calendar-plus")}Add to my calendar</a>'
            f'<div class="cluster" style="justify-content: space-between;"><a class="btn btn--ghost btn--sm" href="{D("share-event")}">{icon("share")}Share</a>'
            f'<a class="btn btn--ghost btn--sm" href="{D("report-event")}">{icon("flag")}Report a problem</a></div>'
            f'<p class="text-caption">Tickets are sold by the organizer. 6ixstack never charges attendees.</p></div>')


def day_body(extra_speakers=SPEAKERS_DAY):
    return (f'<section class="prose" aria-labelledby="about-h"><h2 id="about-h">About this event</h2>'
            f'<p>A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track. Bring a laptop with an Azure subscription for the labs; trial credits are available at the door.</p>'
            f'<ul><li>Two tracks: talks on the main stage, labs in Hall B</li><li>Lunch and coffee included; vegetarian, vegan and halal options</li><li>Step-free access from the Square One transit terminal</li></ul></section>'
            f'<section aria-labelledby="agenda-h"><h2 id="agenda-h" style="font: var(--text-h4); margin-bottom: var(--space-4);">Agenda</h2><ol class="agenda">'
            f'<li><span class="agenda__time">9:00 AM</span><span>Registration and coffee</span></li>'
            f'<li><span class="agenda__time">9:30 AM</span><span><strong>Keynote:</strong> Fabric one year later — Priya Natarajan</span></li>'
            f'<li><span class="agenda__time">11:00 AM</span><span>Grounding Azure OpenAI on your lakehouse — Aisha Rahman</span></li>'
            f'<li><span class="agenda__time">12:30 PM</span><span>Lunch</span></li>'
            f'<li><span class="agenda__time">1:30 PM</span><span>Lab: build a real-time dashboard with Eventstream</span></li>'
            f'<li><span class="agenda__time">4:15 PM</span><span>Panel: data teams in Canadian banks — Marcus Bell, Kenji Watanabe</span></li></ol></section>'
            f'<section aria-labelledby="spk-h"><h2 id="spk-h" style="font: var(--text-h4); margin-bottom: var(--space-4);">Speakers</h2>{people(extra_speakers)}</section>'
            f'<section aria-labelledby="venue-h"><h2 id="venue-h" style="font: var(--text-h4); margin-bottom: var(--space-4);">Venue</h2>{venue_map("azure-data-ai-day", "Living Arts Centre, Mississauga")}'
            f'<p class="text-muted" style="margin-top: var(--space-3);">Living Arts Centre, 4141 Living Arts Dr, Mississauga. Free parking in the Civic Centre garage after 6 PM; MiWay and GO buses stop at Square One.</p></section>')


def mobile_cta(price="$49", label="Get tickets"):
    return (f'<div class="sticky-cta"><div><div class="fact__label">Thu, Nov 5 · 9:00 AM</div><div class="fact__value">{price} · 318 going</div></div>'
            f'<a class="btn btn--primary" href="https://tickets.example.org/azure-data-ai-day">{label}</a></div>')


@state("event-detail", "default", "Azure Data & AI Day GTA: hybrid, paid event with agenda, speakers, venue map and ticket CTA.")
def _():
    e = EV["azure-data-ai-day"]
    return detail(e, h1=e["title"], mon="Nov", day=5, org_line=f'by <a href="{P("community-detail")}">GTA Azure Community</a>',
                  facts=day_facts(), cta=day_cta(), body=day_body(), cta_bar=mobile_cta()) + note(
        "On phones the ticket button docks to the bottom of the screen so it is always one tap away.", "top: 7rem; right: 1rem;")


@state("event-detail", "loading", "Event detail skeleton: the same columns and heights as the loaded page.")
def _():
    e = EV["azure-data-ai-day"]
    facts = "".join(f'<div class="fact">{sk("1.25rem", "1.25rem", "skeleton--rect")}<div>{sk("70%", "1rem")}{sk("50%", "0.85rem")}</div></div>' for _ in range(5))
    body = f'<div aria-hidden="true">{sk("30%", "1.4rem")}{sk("100%")}{sk("95%")}{sk("60%")}</div><div aria-hidden="true">{sk("20%", "1.4rem")}{sk("100%", "12rem", "skeleton--rect")}</div>'
    main = (f'<a class="back-link" href="{P("events")}">{icon("arrow-left", "icon icon--sm")}All events</a>'
            f'<div class="page-grid"><div style="min-width: 0;"><div class="detail-hero">{sk("4.5rem", "4.5rem", "skeleton--rect")}<div style="flex: 1;">'
            f'<h1><span class="visually-hidden">Loading event</span>{sk("80%", "2.4rem", "skeleton--title")}</h1>{sk("40%", "1.1rem")}</div></div>'
            f'<div class="stack-gap">{body}</div></div><aside class="stack" aria-label="Event details" aria-busy="true"><div class="facts">{facts}</div>'
            f'{sk("100%", "3rem", "skeleton--rect")}{sk("100%", "2.5rem", "skeleton--rect")}</aside></div>')
    return shell(main, "events")


@state("event-detail", "error", "The event failed to load: plain explanation, retry, and a way back to all events.")
def _():
    main = (f'<a class="back-link" href="{P("events")}">{icon("arrow-left", "icon icon--sm")}All events</a>' + empty(
        "alert", "This event didn't load", "We couldn't reach 6ixstack. Check your connection and try again; nothing you did caused this.",
        f'<button class="btn btn--primary" type="button">{icon("refresh")}Try again</button><a class="btn" href="{P("events")}">Back to all events</a>', error=True, heading="h1"))
    return shell(main, "events")


@state("event-detail", "streaming", "A streaming-only event: shows both Toronto and source time zones and a join-stream CTA.")
def _():
    e = EV["reactor-foundry-agents"]
    facts = (fact("calendar", "Wednesday, November 4, 2026", "12:00 PM – 1:30 PM ET · 9:00 AM PT where it's hosted") +
             fact("radio", "Streaming online", "YouTube and Microsoft Learn; the link opens 15 minutes before start") +
             fact("ticket", "Free", "No registration needed") + fact("users", "2,310 going", "Recording available afterwards"))
    cta = (f'<div class="stack stack--sm"><a class="btn btn--primary btn--lg btn--block" href="https://learn.microsoft.com/events/reactor">{icon("video")}Join the stream{icon("external")}</a>'
           f'<a class="btn btn--block" href="{D("add-to-calendar")}">{icon("calendar-plus")}Add to my calendar</a>'
           f'<div class="cluster" style="justify-content: space-between;"><a class="btn btn--ghost btn--sm" href="{D("share-event")}">{icon("share")}Share</a>'
           f'<a class="btn btn--ghost btn--sm" href="{D("report-event")}">{icon("flag")}Report a problem</a></div></div>')
    body = (f'<section class="prose" aria-labelledby="about-h"><h2 id="about-h">About this event</h2><p>{e["desc"]} Live demos of the Foundry evaluation SDK, tracing with OpenTelemetry and staged rollouts with feature flags.</p>'
            f'<p>Questions are taken in the chat; the session is recorded and posted on Microsoft Learn within a day.</p></section>'
            f'<section aria-labelledby="spk-h"><h2 id="spk-h" style="font: var(--text-h4); margin-bottom: var(--space-4);">Speakers</h2>{people([("Sofia Marchetti", "SM", "Cloud advocate, Microsoft"), ("Daniel Okafor", "DO", "Principal PM, Azure AI Foundry")])}</section>'
            f'<section aria-labelledby="from-h"><h2 id="from-h" style="font: var(--text-h4); margin-bottom: var(--space-4);">Where it streams from</h2>'
            f'{event_map([e], timeline=False, compact=True, uid="s", title="Streaming in from Redmond", sub="12:00 PM in Toronto · 9:00 AM where it’s hosted")}</section>')
    inline = '<div style="margin-bottom: var(--space-6);">' + alert("info", "Starts in 2 days", "We'll show the stream link here 15 minutes before 12:00 PM ET.") + "</div>"
    return detail(e, h1=e["title"], mon="Nov", day=4, org_line=f'by <a href="{P("community-detail")}">Microsoft Reactor</a>', facts=facts, cta=cta, body=body, inline=inline,
                  cta_bar='<div class="sticky-cta"><div><div class="fact__label">Wed, Nov 4 · 12:00 PM ET</div><div class="fact__value">Free · streaming</div></div><a class="btn btn--primary" href="https://learn.microsoft.com/events/reactor">Join the stream</a></div>')


@state("event-detail", "past", "An event that already happened: tickets are gone, the recording and slides take their place.")
def _():
    e = dict(EV["tdnug-net11"], topics=["dotnet"])
    facts = (fact("calendar", "Tuesday, October 20, 2026", "6:00 PM – 8:30 PM ET · ended") + fact("pin", "Microsoft Canada", "81 Bay St, Toronto") + fact("users", "131 attended", ""))
    cta = (f'<div class="stack stack--sm"><a class="btn btn--primary btn--lg btn--block" href="https://www.youtube.com/@torontodotnet">{icon("video")}Watch the recording{icon("external")}</a>'
           f'<a class="btn btn--block" href="https://github.com/torontodotnet/minimal-apis">{icon("download")}Slides and code</a>'
           f'<a class="btn btn--ghost btn--block" href="{P("community-detail")}">See upcoming Toronto .NET events</a></div>')
    body = (f'<section class="prose" aria-labelledby="about-h"><h2 id="about-h">About this event</h2><p>Endpoint filters, typed results and OpenAPI in .NET 10 minimal APIs, with a live migration of a controller-based app.</p></section>')
    inline = '<div style="margin-bottom: var(--space-6);">' + alert("info", "This event has ended", f'Toronto .NET User Group meets again on November 3. <a href="{P("event-detail")}">See the next one</a>') + "</div>"
    return detail(e, h1="Minimal APIs in practice", mon="Oct", day=20, org_line=f'by <a href="{P("community-detail")}">Toronto .NET User Group</a>', facts=facts, cta=cta, body=body, inline=inline)


@state("event-detail", "cancelled", "Organizer cancelled the event: reason shown first, actions removed, alternatives offered.")
def _():
    e = EV["brampton-blazor-angular"]
    facts = (fact("calendar", "Thursday, November 12, 2026", "<s>6:30 PM – 9:00 PM ET</s> · cancelled") + fact("pin", "Brampton Innovation District", "8 Nelson St W, Brampton"))
    cta = (f'<div class="stack stack--sm"><a class="btn btn--primary btn--block" href="{P("events", "filtered")}">Find another .NET or Angular event</a>'
           f'<a class="btn btn--block" href="{P("community-detail")}">Follow Brampton Dev Night</a></div>')
    inline = '<div style="margin-bottom: var(--space-6);">' + alert("danger", "Cancelled by the organizer on November 1",
                                                                     "“Our venue had a scheduling conflict. We're rebooking for January and will post the new date here.” — Brampton Dev Night") + "</div>"
    body = f'<section class="prose" aria-labelledby="about-h"><h2 id="about-h">About this event</h2><p class="text-muted">{e["desc"]}</p></section>'
    return detail(e, h1=e["title"], mon="Nov", day=12, org_line=f'by <a href="{P("community-detail")}">Brampton Dev Night</a>', facts=facts, cta=cta, body=body, inline=inline)


# ======================================================================= calendar
screen("calendar", "page", "Calendar", route="/calendar")
DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


def month_grid(month="November 2026", today=2, events_by_day=None, start_offset=0, days=30, next_days=5):
    events_by_day = events_by_day if events_by_day is not None else default_month()
    cells = "".join(f'<div class="cal__dow" role="columnheader"><abbr title="{d}day">{d}</abbr></div>'.replace("Satday", "Saturday").replace("Tueday", "Tuesday").replace("Wedday", "Wednesday").replace("Thuday", "Thursday") for d in DOW)
    for d in range(1, days + 1):
        evs = events_by_day.get(d, [])
        cls = "cal__day" + (" cal__day--today" if d == today else "")
        shown = evs[:3]
        links = "".join(
            f'<a class="cal__event" href="{h}"><span class="topic-dot topic-dot--{t}" aria-hidden="true"></span><span>{esc(title)}</span></a>' for title, t, h in shown)
        more = f'<span class="cal__more">+{len(evs) - 3} more</span>' if len(evs) > 3 else ""
        lab = f'November {d}' + (", today" if d == today else "") + (f', {len(evs)} event{"s" if len(evs) != 1 else ""}' if evs else ", no events")
        cells += f'<div class="{cls}" role="gridcell" aria-label="{lab}"><span class="cal__num" aria-hidden="true">{d}</span><div class="cal__events">{links}{more}</div></div>'
    for d in range(1, next_days + 1):
        cells += f'<div class="cal__day cal__day--outside" role="gridcell" aria-label="December {d}"><span class="cal__num" aria-hidden="true">{d}</span></div>'
    return f'<div class="cal" role="grid" aria-label="{month}">{cells}</div>'


def default_month():
    m = {}
    for e in EVENTS:
        d = int(e["date"][-2:])
        m.setdefault(d, []).append((e["title"], e["topics"][0], event_href(e)))
    for l in LATER:
        m.setdefault(l["day"], []).append((l["title"], l["topics"][0], P("event-detail")))
    return m


def calendar_page(grid, month="November 2026", sub="20 events this month · 15 in the GTA · 7 streamable", fmt="all", pressed=(), counts=(20, 15, 7), extra=""):
    main = (f'<div class="page-title"><h1>Calendar</h1><p class="lead">{sub}</p></div>'
            f'{filters(fmt, pressed, counts)}<div style="margin-top: var(--space-6);">'
            f'<div class="cal-toolbar"><div class="cluster"><a class="btn btn--icon" href="{P("calendar")}" aria-label="Previous month, October 2026">{icon("chevron-left")}</a>'
            f'<h2 aria-live="polite">{month}</h2><a class="btn btn--icon" href="{P("calendar", "empty")}" aria-label="Next month, December 2026">{icon("chevron-right")}</a>'
            f'<a class="btn btn--sm" href="{P("calendar")}">Today</a></div>'
            f'<div class="btn-group" role="group" aria-label="View"><a class="btn btn--sm" href="{P("events")}">{icon("list")}List</a>'
            f'<a class="btn btn--sm" href="{P("calendar")}" aria-pressed="true" aria-current="page">{icon("grid")}Month</a></div></div>'
            f'{extra}{grid}<div class="cal-legend">' + "".join(topic_tag(k) for k, _ in TOPICS) + '</div></div>')
    return shell(main, "calendar")


@state("calendar", "default", "November 2026 month grid with today marked, up to three events per day and overflow counts.")
def _():
    return calendar_page(month_grid()) + note("Under 768 px each day shows topic dots only; tapping a day opens that day's list.", "top: 20rem; right: 1rem;")


@state("calendar", "loading", "Month grid frame renders immediately; event chips are skeletons until the month loads.")
def _():
    sk_days = {d: [] for d in range(1, 31)}
    grid = month_grid(events_by_day=sk_days).replace('<div class="cal__events"></div>', f'<div class="cal__events" aria-hidden="true">{sk("85%", "0.9rem", "skeleton--rect")}</div>')
    return calendar_page(grid.replace('aria-label="November 2026"', 'aria-label="November 2026" aria-busy="true"'), sub="Loading November…", counts=("–", "–", "–"))


@state("calendar", "empty", "December 2026 has no events yet: the grid stays, with an explanation and a submit action.")
def _():
    grid = month_grid("December 2026", today=0, events_by_day={}, days=31, next_days=2).replace("November ", "December ")
    extra = '<div style="margin-bottom: var(--space-4);">' + alert("info", "Nothing listed for December yet",
                                                                  f'Organizers usually post December meetups by mid-November. <a href="{P("submit-event")}">Submit an event</a> or <a href="{D("subscribe-feed")}">subscribe to a feed</a> to see them as they arrive.') + "</div>"
    return calendar_page(grid, "December 2026", "0 events this month", counts=(0, 0, 0), extra=extra)


@state("calendar", "error", "The month failed to load; the grid frame and navigation remain with a retry.")
def _():
    grid = month_grid(events_by_day={})
    extra = '<div style="margin-bottom: var(--space-4);">' + alert("danger", "We couldn't load November's events", "The calendar is showing empty days because the request failed, not because nothing is on.",
                                                                  '<button type="button">Try again</button>', role="alert") + "</div>"
    return calendar_page(grid, sub="Events unavailable", counts=("–", "–", "–"), extra=extra)


@state("calendar", "no-results", "React + In the GTA filters leave only one event this month; the filters stay visible and clearable.")
def _():
    m = {9: [("Server Components, one year in", "react", P("event-detail"))], 26: [("Testing React in 2027", "react", P("event-detail"))]}
    extra = '<div style="margin-bottom: var(--space-4);">' + alert("info", "2 events match React in the GTA", f'Include streaming to see 1 more. <a href="{P("calendar")}">Clear filters</a>') + "</div>"
    return calendar_page(month_grid(events_by_day=m), sub="2 of 20 events this month match your filters", fmt="gta", pressed=("react",), counts=(3, 2, 1), extra=extra)


# ======================================================================= dialogs
def events_behind():
    return inert(events_page(result_line("14 events · times in ET") + day_groups(EVENTS[:5])))


def detail_behind():
    e = EV["azure-data-ai-day"]
    return inert(detail(e, h1=e["title"], mon="Nov", day=5, org_line="by GTA Azure Community", facts=day_facts(), cta=day_cta(), body=day_body()))


# ---- mobile nav
screen("mobile-nav", "dialog", "Mobile menu", opens_from="events",
       na={"busy": "Navigation only; nothing is submitted.", "invalid": "The menu has no inputs."})


@state("mobile-nav", "default", "Phone menu sheet: primary navigation, submit event, feeds and organizer sign in.")
def _():
    links = "".join(f'<a class="nav-link" href="{P(i)}"{CUR if i == "events" else ""}>{t}</a>' for i, t in NAV)
    body = (f'<nav class="mobile-nav" aria-label="Menu">{links}</nav><hr class="divider" style="margin: var(--space-2) 0;">'
            f'<nav class="mobile-nav" aria-label="More"><a class="nav-link" href="{P("calendar-feeds")}">{icon("rss")}Calendar feeds</a>'
            f'<a class="nav-link" href="{P("sign-in")}">{icon("user")}Organizer sign in</a></nav>')
    foot = f'<a class="btn btn--primary btn--block btn--lg" href="{P("submit-event")}">{icon("plus")}Submit event</a>'
    return events_behind() + dialog("Menu", body, foot) + note("Shown as a bottom sheet on phones (the only place it appears). Escape or the close button returns focus to the menu button.", "top: 1rem; left: 1rem;")


# ---- subscribe feed
screen("subscribe-feed", "dialog", "Subscribe to a feed", opens_from="events")


def feed_form(invalid=False, disabled=False, checked=("ai", "azure")):
    err = '<span class="field__error" id="topics-error">Pick at least one topic, or choose “All topics”.</span>' if invalid else ""
    d = ' aria-describedby="topics-error"' if invalid else ""
    iv = ' aria-invalid="true"' if invalid else ""
    boxes = "".join(f'<label class="choice"><input type="checkbox" name="topic" value="{k}"{" checked" if k in checked else ""}{iv}{d}><span class="choice__text"><span class="topic-tag" style="color: var(--color-fg-default);"><span class="topic-dot topic-dot--{k}" aria-hidden="true"></span>{t}</span></span></label>' for k, t in TOPICS)
    return (f'<fieldset{" disabled" if disabled else ""}><legend>Topics</legend><div class="form-grid form-grid--3" style="margin-top: 0; gap: var(--space-2);">{boxes}</div>{err}</fieldset>'
            f'<fieldset{" disabled" if disabled else ""}><legend>Where</legend><div class="choice-row">'
            f'<label class="choice"><input type="radio" name="where" checked><span class="choice__text">GTA and streaming</span></label>'
            f'<label class="choice"><input type="radio" name="where"><span class="choice__text">GTA only</span></label>'
            f'<label class="choice"><input type="radio" name="where"><span class="choice__text">Streaming only</span></label></div></fieldset>')


def feed_footer(busy=False):
    b = ' aria-busy="true"' if busy else ""
    return f'<a class="btn" href="{P("events")}">Cancel</a><button class="btn btn--primary" type="button"{b}>{"Creating feed…" if busy else "Create feed link"}</button>'


DESC_FEED = "Your calendar app checks the feed every few hours, so new and changed events show up on their own."


@state("subscribe-feed", "default", "Pick topics and where; creating the feed returns a link for any calendar app.")
def _():
    return events_behind() + dialog("Subscribe to a calendar feed", feed_form(), feed_footer(), DESC_FEED, size="dialog__panel--lg")


@state("subscribe-feed", "busy", "Creating the feed link: inputs locked, primary button busy, Cancel still available.")
def _():
    return events_behind() + dialog("Subscribe to a calendar feed", feed_form(disabled=True), feed_footer(busy=True), DESC_FEED, size="dialog__panel--lg")


@state("subscribe-feed", "invalid", "No topic chosen: inline error on the topic group, focus moved to the first checkbox.")
def _():
    return events_behind() + dialog("Subscribe to a calendar feed", feed_form(invalid=True, checked=()), feed_footer(), DESC_FEED, size="dialog__panel--lg")


@state("subscribe-feed", "failed", "Server error creating the feed: error at the top, choices preserved, retry.")
def _():
    body = alert("danger", "We couldn't create your feed", "Your choices are saved. Try again, or use the full feed for all events.", role="alert") + feed_form()
    return events_behind() + dialog("Subscribe to a calendar feed", body, feed_footer().replace("Create feed link", "Try again"), DESC_FEED, size="dialog__panel--lg")


@state("subscribe-feed", "success", "Feed link ready: copy it or open it directly in Google, Outlook or Apple Calendar.")
def _():
    url = "webcal://6ixstack.dev/feeds/ai-azure-gta-stream.ics"
    body = (alert("success", "Your feed is ready", "AI and Azure events, in the GTA and streaming. 11 events right now.") +
            f'<div class="field"><label class="field__label" for="feed-url">Feed link</label><div class="copy-field"><input class="input" id="feed-url" readonly value="{url}">'
            f'<a class="btn" href="{N("app-toast", "success")}">{icon("copy")}Copy</a></div></div>'
            f'<ul class="option-list"><li><a class="option-btn" href="https://calendar.google.com/calendar/r?cid={url}">{icon("calendar")}<span>Google Calendar</span>{icon("external")}</a></li>'
            f'<li><a class="option-btn" href="https://outlook.live.com/calendar/addcalendar?url={url}">{icon("calendar")}<span>Outlook</span>{icon("external")}</a></li>'
            f'<li><a class="option-btn" href="{url}">{icon("calendar")}<span>Apple Calendar</span>{icon("external")}</a></li></ul>')
    return events_behind() + dialog("Subscribe to a calendar feed", body, f'<a class="btn btn--primary" href="{P("events")}" autofocus>Done</a>')


# ---- add to calendar
screen("add-to-calendar", "dialog", "Add to my calendar", opens_from="event-detail",
       na={"invalid": "One-tap choices; there is nothing to validate."})


def cal_options(busy=None):
    opts = [("google", "Google Calendar", "Opens a new tab"), ("outlook", "Outlook", "Outlook.com or Microsoft 365"), ("apple", "Apple Calendar", "Downloads an .ics file"), ("ics", "Other app (.ics file)", "Works with any calendar")]
    out = ""
    for k, t, s in opts:
        b = ' aria-busy="true"' if k == busy else ""
        out += f'<li><a class="option-btn" href="{N("app-toast", "success")}"{b}>{icon("calendar")}<span>{t}<small>{s}</small></span>{icon("external" if k in ("google", "outlook") else "download")}</a></li>'
    return f'<ul class="option-list">{out}</ul>'


DESC_CAL = "Azure Data & AI Day GTA · Thu, Nov 5, 9:00 AM – 5:00 PM ET · Living Arts Centre"


@state("add-to-calendar", "default", "Four ways to add the event; times are converted from ET to the viewer's calendar.")
def _():
    return detail_behind() + dialog("Add to my calendar", cal_options(), "", DESC_CAL)


@state("add-to-calendar", "busy", "Generating the .ics file: the chosen option is busy, others stay usable.")
def _():
    return detail_behind() + dialog("Add to my calendar", cal_options("apple"), "", DESC_CAL)


@state("add-to-calendar", "failed", "The .ics file couldn't be created; the other options still work.")
def _():
    body = alert("danger", "We couldn't create the calendar file", "Try again, or add it with Google Calendar or Outlook instead.", role="alert") + cal_options()
    return detail_behind() + dialog("Add to my calendar", body, "", DESC_CAL)


# ---- share
screen("share-event", "dialog", "Share event", opens_from="event-detail",
       na={"busy": "Copying and share links are instant and local.", "invalid": "Nothing to fill in."})


def share_body(copied=False):
    btn = f'<button class="btn" type="button" aria-live="polite">{icon("check")}Copied</button>' if copied else f'<button class="btn" type="button" autofocus>{icon("copy")}Copy</button>'
    return (f'<div class="field"><label class="field__label" for="share-url">Event link</label><div class="copy-field"><input class="input" id="share-url" readonly value="https://6ixstack.dev/e/azure-data-ai-day">{btn}</div></div>'
            f'<ul class="option-list"><li><a class="option-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=https://6ixstack.dev/e/azure-data-ai-day">{icon("share")}<span>LinkedIn</span>{icon("external")}</a></li>'
            f'<li><a class="option-btn" href="https://bsky.app/intent/compose?text=https://6ixstack.dev/e/azure-data-ai-day">{icon("share")}<span>Bluesky</span>{icon("external")}</a></li>'
            f'<li><a class="option-btn" href="mailto:?subject=Azure%20Data%20%26%20AI%20Day%20GTA&amp;body=https://6ixstack.dev/e/azure-data-ai-day">{icon("mail")}<span>Email</span>{icon("external")}</a></li></ul>')


@state("share-event", "default", "Copy the short link or share to LinkedIn, Bluesky or email. Uses the native share sheet on phones.")
def _():
    return detail_behind() + dialog("Share this event", share_body(), "", DESC_CAL) + note("On phones with the Web Share API, “Share” opens the system share sheet instead of this dialog.", "top: 1rem; left: 1rem;")


@state("share-event", "success", "Link copied: the copy button confirms in place for 2 seconds, no toast needed.")
def _():
    return detail_behind() + dialog("Share this event", share_body(True), "", DESC_CAL)


# ---- report a problem
screen("report-event", "dialog", "Report a problem", opens_from="event-detail")


def report_form(invalid=False, disabled=False, picked=None, details=""):
    reasons = [("wrong", "Wrong date, time or venue"), ("cancelled", "The event is cancelled"), ("link", "Ticket or stream link is broken"), ("spam", "Spam or not a dev event"), ("conduct", "Code of conduct concern")]
    iv = ' aria-invalid="true" aria-describedby="reason-error"' if invalid else ""
    radios = "".join(f'<label class="choice"><input type="radio" name="reason" value="{k}"{" checked" if k == picked else ""}{iv}{" autofocus" if invalid and k == "wrong" else ""}><span class="choice__text">{t}</span></label>' for k, t in reasons)
    err = '<span class="field__error" id="reason-error">Choose what is wrong so we can route it to the right person.</span>' if invalid else ""
    return (f'<fieldset{" disabled" if disabled else ""} class="stack"><fieldset><legend>What is wrong?</legend>{radios}{err}</fieldset>'
            + field("Details", f'<textarea class="textarea" id="report-details" rows="3" aria-describedby="report-details-help">{esc(details)}</textarea>', "Links or screenshots help. Organizers don't see who reported.", fid="report-details", optional=True)
            + field("Your email", inp("report-email", "", "email", "name@example.com", help=True), "Only if you want a reply.", fid="report-email", optional=True) + "</fieldset>")


def report_footer(busy=False, label="Send report"):
    b = ' aria-busy="true"' if busy else ""
    return f'<a class="btn" href="{P("event-detail")}">Cancel</a><button class="btn btn--primary" type="button"{b}>{"Sending…" if busy else label}</button>'


DESC_REP = "Tell the 6ixstack moderators about Azure Data & AI Day GTA. We review reports within a day."


@state("report-event", "default", "Report form: reason (required), optional details and email.")
def _():
    return detail_behind() + dialog("Report a problem", report_form(), report_footer(), DESC_REP)


@state("report-event", "busy", "Sending the report: fields locked, button busy, Cancel stays enabled.")
def _():
    return detail_behind() + dialog("Report a problem", report_form(disabled=True, picked="wrong", details="The venue page says Hall B, but the ticket says the Hammerson Hall."), report_footer(True), DESC_REP)


@state("report-event", "invalid", "Sent without a reason: inline error on the reason group, focus on its first option.")
def _():
    return detail_behind() + dialog("Report a problem", report_form(invalid=True), report_footer(), DESC_REP)


@state("report-event", "failed", "Sending failed: error at the top, the reason and details are preserved.")
def _():
    body = alert("danger", "Your report didn't send", "Check your connection and try again. Nothing you wrote was lost.", role="alert") + report_form(picked="wrong", details="The venue page says Hall B, but the ticket says the Hammerson Hall.")
    return detail_behind() + dialog("Report a problem", body, report_footer(label="Try again"), DESC_REP)


@state("report-event", "success", "Report received: says what happens next and when.")
def _():
    body = (f'<div class="success-panel"><div class="success-panel__icon">{icon("check-circle", "icon icon--lg")}</div>'
            f'<p>Thanks — a moderator will check it today. If the details are wrong, we’ll fix the listing and let GTA Azure Community know.</p></div>')
    return detail_behind() + dialog("Report sent", body, f'<a class="btn btn--primary" href="{P("event-detail")}" autofocus>Back to the event</a>')


# ======================================================================= notifications
screen("app-toast", "notification", "Toast", opens_from="events")


def events_under():
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS[:6]))


@state("app-toast", "info", "Neutral toast: explains the time zone the first time a visitor from outside Toronto filters.")
def _():
    return events_under() + toast_region(toast("info", "Times are in Toronto time (ET)", "Streams also show the time where they're hosted.")) + note("Auto-dismisses after 8 s; pauses on hover and focus.", "bottom: 9rem; right: 1rem;")


@state("app-toast", "success", "Feed link copied, with a link to setup instructions.")
def _():
    return events_under() + toast_region(toast("success", "Feed link copied", "Paste it into Google Calendar, Outlook or Apple Calendar.", "How to subscribe"))


@state("app-toast", "warning", "Filters can't be remembered in this browser (storage blocked).")
def _():
    return events_under() + toast_region(toast("warning", "We can't remember your filters", "This browser blocks site storage, so your topics reset when you close the tab."))


@state("app-toast", "danger", "Copy failed: persistent error toast with a retry; never auto-dismisses.")
def _():
    return events_under() + toast_region(toast("danger", "Couldn't copy the link", "Select the link and copy it manually, or try again.", "Try again", role="alert"))


@state("app-toast", "with-action", "Filters cleared with an Undo that restores the previous topics.")
def _():
    return events_under() + toast_region(toast("info", "Filters cleared", "Showing all 14 events.", "Undo"))


@state("app-toast", "stacked", "Three toasts at once: newest at the bottom, 12 px apart, each dismissible.")
def _():
    return events_under() + toast_region(
        toast("success", "Added to Google Calendar", "Azure Data & AI Day GTA, Thu Nov 5."),
        toast("info", "Filters cleared", "Showing all 14 events.", "Undo"),
        toast("danger", "Couldn't copy the link", "Select the link and copy it manually.", "Try again", role="alert")) + note("At most three toasts show; older ones collapse into the notification history.", "bottom: 22rem; right: 1rem;")


screen("event-alert", "notification", "Event status alert", opens_from="event-detail")


def detail_with(inline):
    e = EV["azure-data-ai-day"]
    return detail(e, h1=e["title"], mon="Nov", day=5, org_line=f'by <a href="{P("community-detail")}">GTA Azure Community</a>', facts=day_facts(),
                  cta=day_cta(), body=day_body(), inline=f'<div style="margin-bottom: var(--space-6);">{inline}</div>', cta_bar=mobile_cta())


@state("event-alert", "info", "Inline note: lab seats are first come, first served.")
def _():
    return detail_with(alert("info", "Lab seats are first come, first served", "Hall B fits 60. Arrive by 1:15 PM to get a seat for the Eventstream lab."))


@state("event-alert", "success", "The organizer confirmed the event after a venue check.")
def _():
    return detail_with(alert("success", "Confirmed by the organizer", "GTA Azure Community confirmed the date, venue and livestream on November 1."))


@state("event-alert", "warning", "The organizer changed the start time; the change is called out with when it happened.")
def _():
    return detail_with(alert("warning", "Start time changed to 9:30 AM", "Updated by GTA Azure Community 2 hours ago. Calendar feeds update automatically; re-add it if you saved a file.",
                             f'<a href="{D("add-to-calendar")}">Update my calendar</a>'))


@state("event-alert", "danger", "Tickets are sold out; the waitlist replaces the ticket CTA.")
def _():
    return detail_with(alert("danger", "Sold out", "All 400 tickets are gone. Join the waitlist on the ticket page; the livestream is still free.",
                             '<a href="https://tickets.example.org/azure-data-ai-day">Join the waitlist</a>'))


screen("site-banner", "notification", "Site banner", opens_from="events")


def banner(kind, title, text="", actions="", close=True, role=None):
    return alert(kind, title, text, actions, close=close, cls="site-banner", role=role)


@state("site-banner", "info", "A new version is available; refresh to update.")
def _():
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS[:5]),
                       banner=banner("info", "6ixstack was updated", "Refresh to get the newest events and fixes.", '<button type="button">Refresh</button>'))


@state("site-banner", "success", "Back online after an outage; the list refreshed itself.")
def _():
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS[:5]),
                       banner=banner("success", "You're back online", "Events are up to date as of 10:14 AM.", role="status"))


@state("site-banner", "warning", "Offline: cached events are shown and actions that need the network are disabled.")
def _():
    return events_page(result_line("14 events saved at 9:42 AM · times in ET") + day_groups(EVENTS[:5]),
                       banner=banner("warning", "You're offline", "Showing events saved at 9:42 AM. Submitting and feeds need a connection.", close=False, role="status"))


@state("site-banner", "danger", "6ixstack is unreachable; retries automatically and says when.")
def _():
    return events_page(result_line("14 events saved at 9:42 AM · times in ET") + day_groups(EVENTS[:5]),
                       banner=banner("danger", "We can't reach 6ixstack", "Retrying in 30 seconds. The events below may be out of date.", '<button type="button">Retry now</button>', close=False, role="alert"))


@state("site-banner", "persistent", "Scheduled maintenance notice that stays until dismissed and remembers the dismissal.")
def _():
    return events_page(result_line("14 events · times in ET") + day_groups(EVENTS[:5]),
                       banner=banner("info", "Submissions pause Sunday, Nov 8, 2–4 AM ET", "Browsing and feeds keep working during maintenance.")) + note("Stays until dismissed; the dismissal is remembered for this maintenance window only.", "top: 8rem; right: 1rem;")
