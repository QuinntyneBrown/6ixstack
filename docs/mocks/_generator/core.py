"""Shared chrome, data and rendering for the 6ixstack HTML mocks.

Every screen module registers screens with `screen(...)` and states with
`@state(screen_id, name, desc)`. `build.py` renders them all into docs/mocks
and writes manifest.json. Every mock lives two folders deep, so links between
mocks are always `../../<folder>/<id>/<state>.html` (see P, D, N).
"""
from __future__ import annotations
import html, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDERS = {"page": "pages", "dialog": "dialogs", "notification": "notifications"}
SCREENS: dict[str, dict] = {}   # id -> {id, kind, title, route, opens_from, states: {name: (fn, desc)}, na}


CUR = ' aria-current="page"'
HOVER = ' data-state="hover"'


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def screen(id, kind, title, route=None, opens_from=None, na=None):
    SCREENS[id] = {"id": id, "kind": kind, "title": title, "route": route, "opens_from": opens_from,
                   "states": {}, "na": na or {}}


def state(sid, name, desc):
    def deco(fn):
        SCREENS[sid]["states"][name] = (fn, desc)
        return fn
    return deco


def P(id, st="default"): return f"../../pages/{id}/{st}.html"
def D(id, st="default"): return f"../../dialogs/{id}/{st}.html"
def N(id, st="default"): return f"../../notifications/{id}/{st}.html"


# ---------------------------------------------------------------- icons
_I = {
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>',
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "radio": '<path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/><path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/>',
    "calendar": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    "calendar-plus": '<path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-left": '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    "external": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "menu": '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "warning": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "alert": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "share": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "rss": '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "ticket": '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    "flag": '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "wifi-off": '<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><path d="m2 2 20 20"/>',
    "refresh": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "sliders": '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
    "bell": '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 2.4a7 7 0 0 0-1.7 1L5.1 5.5l-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.7 1l.4 2.4h5l.4-2.4a7 7 0 0 0 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    "edit": '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    "trash": '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    "video": '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "building": '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    "mic": '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    "inbox": '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    "search-x": '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    "list": '<path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>',
    "grid": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    "undo": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    "server": '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
    "compass": '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
    "play": '<path d="M6 3.5v17a.5.5 0 0 0 .77.42l13.2-8.5a.5.5 0 0 0 0-.84L6.77 3.08A.5.5 0 0 0 6 3.5z"/>',
    "pause": '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    "map": '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
    "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
}


def icon(name, cls="icon", label=None):
    a = f' role="img" aria-label="{esc(label)}"' if label else ' aria-hidden="true"'
    return f'<svg class="{cls}"{a} viewBox="0 0 24 24">{_I[name]}</svg>'


# ---------------------------------------------------------------- data (the cast; see README)
TODAY = "Monday, November 2, 2026"
TOPICS = [("ai", "AI"), ("dotnet", ".NET"), ("azure", "Azure"), ("angular", "Angular"), ("react", "React"), ("aws", "AWS")]
TOPIC = dict(TOPICS)

E = lambda **k: k
EVENTS = [
    E(id="tdnug-net11", title="What's new in the .NET 11 previews", org="Toronto .NET User Group", desc="A walkthrough of runtime, C# and ASP.NET Core changes, with live demos and pizza after.", topics=["dotnet"], fmt="in-person", date="2026-11-03", dow="Tuesday", md="November 3", start="6:00 PM", end="8:30 PM", venue="Microsoft Canada, 81 Bay St", city="Toronto", price="Free", going=142),
    E(id="reactor-foundry-agents", title="Azure AI Foundry: shipping agents to production", org="Microsoft Reactor", desc="Evaluation, tracing and safe rollout patterns for agentic apps on Azure.", topics=["ai", "azure"], fmt="streaming", date="2026-11-04", dow="Wednesday", md="November 4", start="12:00 PM", end="1:30 PM", source="9:00 AM PT", price="Free", going=2310),
    E(id="ngto-signals", title="Signals all the way down", org="Angular Toronto", desc="Migrating a large app from RxJS-heavy state to signals, and what broke along the way.", topics=["angular"], fmt="in-person", date="2026-11-04", dow="Wednesday", md="November 4", start="6:30 PM", end="9:00 PM", venue="MaRS Discovery District", city="Toronto", price="Free", going=87),
    E(id="azure-data-ai-day", title="Azure Data & AI Day GTA", org="GTA Azure Community", desc="A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track.", topics=["azure", "ai"], fmt="hybrid", date="2026-11-05", dow="Thursday", md="November 5", start="9:00 AM", end="5:00 PM", venue="Living Arts Centre", city="Mississauga", price="$49", going=318, featured=True),
    E(id="awsug-bedrock", title="Bedrock in the real world", org="AWS User Group Toronto", desc="Three short talks from local teams running generative AI workloads on AWS.", topics=["aws", "ai"], fmt="in-person", date="2026-11-05", dow="Thursday", md="November 5", start="6:00 PM", end="8:30 PM", venue="120 Bremner Blvd", city="Toronto", price="Free", going=128),
    E(id="dotnetconf-aspire", title=".NET Aspire deep dive", org=".NET Conf Community", desc="Orchestration, service defaults and deploying Aspire apps to Azure Container Apps.", topics=["dotnet", "azure"], fmt="streaming", date="2026-11-06", dow="Friday", md="November 6", start="11:00 AM", end="12:30 PM", source="4:00 PM GMT", price="Free", going=1480),
    E(id="gta-ai-hackathon", title="GTA AI Builders Hackathon", org="AI Builders GTA", desc="Build with open models in 10 hours. Teams of up to four, mentors on site.", topics=["ai"], fmt="in-person", date="2026-11-07", dow="Saturday", md="November 7", start="10:00 AM", end="8:00 PM", venue="ventureLAB", city="Markham", price="Free", going=164),
    E(id="reactto-rsc", title="Server Components, one year in", org="React Toronto", desc="Lessons from teams that moved production apps to server components.", topics=["react"], fmt="in-person", date="2026-11-09", dow="Monday", md="November 9", start="6:30 PM", end="9:00 PM", venue="Centre for Social Innovation, 192 Spadina Ave", city="Toronto", price="Free", going=112),
    E(id="ngconf-roadmap", title="Angular roadmap: live Q&A with the team", org="ng-conf", desc="The Angular team answers questions on zoneless, SSR and what is next.", topics=["angular"], fmt="streaming", date="2026-11-10", dow="Tuesday", md="November 10", start="1:00 PM", end="2:00 PM", source="11:00 AM MT", price="Free", going=940),
    E(id="wai-rag-eval", title="RAG evaluation workshop", org="Women in AI Toronto", desc="Hands-on: build an eval harness for a retrieval app and compare grounding metrics.", topics=["ai"], fmt="in-person", date="2026-11-10", dow="Tuesday", md="November 10", start="6:00 PM", end="8:30 PM", venue="Vector Institute", city="Toronto", price="$15", going=60),
    E(id="azure-to-landing-zones", title="Landing zones that don't hurt", org="Azure Toronto", desc="Practical Bicep and policy patterns for teams setting up their first enterprise subscription.", topics=["azure"], fmt="hybrid", date="2026-11-11", dow="Wednesday", md="November 11", start="7:00 PM", end="9:00 PM", venue="Spaces, 1 University Ave", city="Toronto", price="Free", going=103),
    E(id="sk-office-hours", title="Semantic Kernel office hours", org="Microsoft Semantic Kernel team", desc="Bring your agent and plugin questions for the product team.", topics=["ai", "dotnet"], fmt="streaming", date="2026-11-12", dow="Thursday", md="November 12", start="12:00 PM", end="1:00 PM", source="9:00 AM PT", price="Free", going=620),
    E(id="brampton-blazor-angular", title="Blazor vs Angular: a friendly fight", org="Brampton Dev Night", desc="Two teams build the same app live. The audience picks a winner.", topics=["dotnet", "angular"], fmt="in-person", date="2026-11-12", dow="Thursday", md="November 12", start="6:30 PM", end="9:00 PM", venue="Brampton Innovation District", city="Brampton", price="Free", going=74),
    E(id="react-summit-perf", title="React Summit Remote: performance track", org="React Summit", desc="Rendering, bundling and profiling talks from the global React community.", topics=["react"], fmt="streaming", date="2026-11-13", dow="Friday", md="November 13", start="11:00 AM", end="3:00 PM", source="5:00 PM CET", price="Free", going=3200),
]
EV = {e["id"]: e for e in EVENTS}
# Later in November: only the calendar month view and community pages show these.
LATER = [
    dict(day=17, title="Vector search in Postgres", topics=["ai"], org="AI Builders GTA"),
    dict(day=19, title="Minimal APIs in practice", topics=["dotnet"], org="Toronto .NET User Group"),
    dict(day=19, title="Angular Toronto: lightning talks", topics=["angular"], org="Angular Toronto"),
    dict(day=19, title="Cloud Native Toronto: November meetup", topics=["aws"], org="Cloud Native Toronto"),
    dict(day=24, title="re:Invent keynote watch party", topics=["aws"], org="AWS User Group Toronto"),
    dict(day=26, title="Testing React in 2027", topics=["react"], org="React Toronto"),
]
# Signed-in organizer and moderator.
ME = dict(name="Priya Natarajan", initials="PN", email="priya@gtaazure.ca", org="GTA Azure Community")
MOD = dict(name="Jordan Lee", initials="JL", email="jordan@6ixstack.dev")


def is_gta(e): return e["fmt"] in ("in-person", "hybrid")
def is_stream(e): return e["fmt"] in ("streaming", "hybrid")
def event_href(e): return P("event-detail", "streaming" if e["fmt"] == "streaming" else "default")


# ---------------------------------------------------------------- chrome
NAV = [("events", "Events"), ("calendar", "Calendar"), ("communities", "Communities"), ("speakers", "Speakers")]


# Official logo mark from the Magic Patterns prototype; same artwork as docs/assets/6ixstack-mark.svg (L2-104).
BRAND_MARK = ('<svg class="brand__mark" aria-hidden="true" focusable="false" viewBox="0 0 32 32">'
              '<rect width="32" height="32" rx="8" fill="#111318"/>'
              '<path d="M19.75 7.25C14 8 10.5 12.5 10.5 19.5" fill="none" stroke="#FFFFFF" stroke-width="3.25" stroke-linecap="round"/>'
              '<circle cx="16" cy="19.5" r="5.5" fill="none" stroke="#FFFFFF" stroke-width="3.25"/>'
              '<circle cx="16" cy="19.5" r="1.9" fill="#FF5A1F"/></svg>')


def brand():
    return (f'<a class="brand" href="{P("events")}" aria-label="6ixstack home">'
            f'{BRAND_MARK}'
            '<span aria-hidden="true"><span class="brand__six">6ix</span><span class="brand__stack">stack</span></span></a>')


def header(active=None, user=None, unread=3, submit=True):
    """Site header. user: None (visitor), 'organizer' (Priya) or 'moderator' (Jordan)."""
    links = "".join(
        f'<a class="nav-link" href="{P(i)}"{CUR if i == active else ""}>{t}</a>' for i, t in NAV)
    acts = []
    if user:
        who = ME if user == "organizer" else MOD
        bell_label = f"Notifications, {unread} unread" if unread else "Notifications"
        badge = f'<span class="badge badge--count" aria-hidden="true">{unread}</span>' if unread else ""
        acts.append(f'<a class="btn btn--ghost btn--icon has-tooltip" href="{P("notifications")}" aria-label="{bell_label}">{icon("bell")}{badge}<span class="tooltip" role="tooltip">Notifications</span></a>')
        home = P("review-queue") if user == "moderator" else P("organizer-dashboard")
        acts.append(f'<a class="avatar avatar--sm" href="{home}" aria-label="Your dashboard, signed in as {who["name"]}" style="text-decoration: none;">{who["initials"]}</a>')
    if submit:
        acts.append(f'<a class="btn btn--primary" href="{P("submit-event")}" aria-label="Submit event">{icon("plus")}<span class="site-header__submit-label">Submit event</span></a>')
    acts.append(f'<a class="btn btn--ghost btn--icon site-header__menu" href="{D("mobile-nav")}" aria-label="Open menu">{icon("menu")}</a>')
    return (f'<header class="site-header"><div class="site-header__inner">{brand()}'
            f'<nav class="site-header__nav" aria-label="Primary">{links}</nav>'
            f'<div class="site-header__actions">{"".join(acts)}</div></div></header>')


def footer():
    items = [("about", "About"), ("code-of-conduct", "Code of conduct"), ("contact", "Contact"), ("calendar-feeds", "Calendar feeds"), ("sign-in", "Organizer sign in")]
    lis = "".join(f'<li><a href="{P(i)}">{t}</a></li>' for i, t in items)
    return (f'<footer class="site-footer"><div class="site-footer__inner"><p>Made in Toronto, for the people building in the 6ix.</p>'
            f'<nav aria-label="Footer"><ul>{lis}</ul></nav></div></footer>')


def shell(main, active=None, user=None, banner="", unread=3, submit=True, after_main=""):
    """Header + optional banner + <main> + footer."""
    return (f'{header(active, user, unread, submit)}{banner}<main id="main" class="page">{main}</main>{after_main}{footer()}')


# ---------------------------------------------------------------- shared fragments
def topic_tag(t):
    return f'<span class="topic-tag"><span class="topic-dot topic-dot--{t}" aria-hidden="true"></span>{TOPIC[t]}</span>'


def location_meta(e):
    out = []
    if e["fmt"] in ("in-person", "hybrid"):
        out.append(f'<span class="meta-item">{icon("pin")}{esc(e["venue"])}, {esc(e["city"])}</span>')
    if e["fmt"] == "streaming":
        out.append(f'<span class="meta-item meta-item--stream">{icon("radio")}Streaming online</span>')
    if e["fmt"] == "hybrid":
        out.append(f'<span class="meta-item meta-item--stream">{icon("radio")}+ stream</span>')
    return "".join(out)


def going(n):
    return f'<span class="going" aria-label="{n:,} going">{icon("users")}{n:,}</span>'


def event_row(e, state_attr="", extra_meta="", href=None, cls=""):
    src = f'<span class="event-row__source">{e["source"]}</span>' if e.get("source") else ""
    tags = "".join(topic_tag(t) for t in e["topics"])
    return (f'<article class="event-row {cls}"{state_attr}>'
            f'<div class="event-row__time"><time datetime="{e["date"]}">{e["start"]}</time>{src}</div>'
            f'<div><h3 class="event-row__title"><a href="{href or event_href(e)}">{esc(e["title"])}</a></h3>'
            f'<p class="event-row__org">{esc(e["org"])}</p>'
            f'<div class="event-row__meta">{location_meta(e)}{tags}{extra_meta}</div></div>'
            f'<div class="event-row__aside"><span class="event-row__price">{e["price"]}</span>{going(e["going"])}</div></article>')


def day_groups(events, hover_first=False, focus_day=None):
    """Events grouped by day. focus_day (from the map timeline) dims the other days and marks the focused one."""
    out, cur, first = [], None, True
    for e in events:
        if e["date"] != cur:
            if cur:
                out.append("</ul></section>")
            cur = e["date"]
            dim = " day-group--dim" if focus_day and cur != focus_day else ""
            dot = '<span class="day-group__focus" aria-hidden="true"></span>' if cur == focus_day else ""
            out.append(f'<section class="day-group{dim}" id="group-{cur}" aria-labelledby="d-{cur}"><h2 class="day-group__heading" id="d-{cur}">{dot}{e["dow"]} <span>{e["md"]}</span></h2><ul class="event-list">')
        st = HOVER if hover_first and first else ""
        first = False
        out.append(f"<li>{event_row(e, st)}</li>")
    if cur:
        out.append("</ul></section>")
    return "".join(out)


def date_tile(mon, day, lg=False):
    return f'<span class="date-tile{" date-tile--lg" if lg else ""}" aria-hidden="true"><span class="date-tile__month">{mon}</span><span class="date-tile__day">{day}</span></span>'


def feature_card():
    e = EV["azure-data-ai-day"]
    return (f'<section class="feature-card" aria-labelledby="featured-title"><p class="feature-card__label">Featured this week</p>'
            f'<div class="feature-card__head">{date_tile("Nov", 5)}<div><h2 class="feature-card__title" id="featured-title"><a href="{P("event-detail")}">{esc(e["title"])}</a></h2>'
            f'<p class="feature-card__org">{e["org"]}</p></div></div>'
            f'<p class="feature-card__desc">{e["desc"]}</p>'
            f'<div class="feature-card__meta"><span class="meta-item">{icon("pin")}Living Arts Centre, Mississauga</span><span class="meta-item meta-item--stream">{icon("radio")}Livestream available</span></div>'
            f'<div class="feature-card__foot"><span class="feature-card__when">Thu · 9:00 AM</span><a class="btn btn--on-feature" href="{P("event-detail")}">Get tickets · $49</a></div></section>')


def aside_blocks(feature=True):
    f = feature_card() if feature else ""
    return (f'<aside class="aside" aria-label="More from 6ixstack">{f}'
            f'<section class="aside-block" aria-labelledby="submit-title"><h2 id="submit-title">Running a meetup or conference?</h2>'
            f'<p>List it free. Local events and global streams are reviewed within a day.</p>'
            f'<a class="arrow-link" href="{P("submit-event")}">Submit an event{icon("arrow-right")}</a></section>'
            f'<section class="aside-block" aria-labelledby="subscribe-title"><h2 id="subscribe-title">Never check back again</h2>'
            f'<p>Subscribe to a calendar feed that only shows the events you care about.</p>'
            f'<a class="arrow-link" href="{D("subscribe-feed")}">Calendar feeds{icon("arrow-right")}</a></section></aside>')


def alert(kind, title, text="", actions="", close=False, cls="", role=None):
    ic = {"info": "info", "success": "check-circle", "warning": "warning", "danger": "alert"}[kind]
    r = f' role="{role}"' if role else ""
    c = f'<button class="close" type="button" aria-label="Dismiss">{icon("x", "icon icon--sm")}</button>' if close else ""
    t = f'<div>{text}</div>' if text else ""
    a = f'<div class="alert__actions">{actions}</div>' if actions else ""
    return f'<div class="alert alert--{kind} {cls}"{r}>{icon(ic)}<div class="alert__body"><p class="alert__title">{title}</p>{t}{a}</div>{c}</div>'


def empty(icon_name, title, text, actions="", error=False, compact=False, heading="h2"):
    cls = "empty" + (" empty--error" if error else "") + (" empty--compact" if compact else "")
    return (f'<div class="{cls}"><div class="empty__icon">{icon(icon_name, "icon icon--lg")}</div>'
            f'<{heading} class="empty__title">{title}</{heading}><p class="empty__text">{text}</p>'
            f'<div class="empty__actions">{actions}</div></div>')


def sk(w="100%", h="1em", cls="skeleton--text", extra=""):
    return f'<span class="skeleton {cls}" style="width: {w}; height: {h};{extra}"></span>'


def skeleton_rows(n=3):
    row = (f'<li><div class="event-row" aria-hidden="true"><div>{sk("4.5rem", "1.1rem")}</div>'
           f'<div>{sk("70%", "1.3rem")}{sk("40%", "1rem")}<div class="event-row__meta">{sk("12rem", "0.9rem")}{sk("4rem", "0.9rem")}</div></div>'
           f'<div class="event-row__aside">{sk("2.5rem", "1rem")}{sk("3rem", "0.9rem")}</div></div></li>')
    return row * n


def toast(kind, title, text="", action="", role=None, progress=True):
    ic = {"info": "info", "success": "check-circle", "warning": "warning", "danger": "alert"}[kind]
    a = f'<button class="toast__action" type="button">{action}</button>' if action else ""
    p = '<span class="toast__progress" aria-hidden="true"></span>' if progress and kind != "danger" else ""
    r = f' role="{role}"' if role else ""
    t = f'<div class="toast__text">{text}</div>' if text else ""
    return (f'<div class="toast toast--{kind}"{r}>{icon(ic)}<div class="toast__body"><div class="toast__title">{title}</div>{t}{a}</div>'
            f'<button class="close" type="button" aria-label="Dismiss">{icon("x", "icon icon--sm")}</button>{p}</div>')


def toast_region(*toasts):
    return f'<div class="toast-region" role="status" aria-live="polite">{"".join(toasts)}</div>'


def dialog(title, body, footer, desc="", icon_html="", size="", close=True, dismiss=True, labelledby="dlg-title", busy_note=""):
    d = f'<p id="dlg-desc" class="text-muted" style="margin-top: var(--space-1);">{desc}</p>' if desc else ""
    dd = ' aria-describedby="dlg-desc"' if desc else ""
    c = (f'<button class="btn btn--ghost btn--icon" type="button" aria-label="Close"{" disabled" if not close else ""}>{icon("x")}</button>')
    f = f'<div class="dialog__footer">{footer}</div>' if footer else ""
    return (f'<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="{labelledby}"{dd}{" data-dismiss-on-escape" if dismiss else ""}>'
            f'<div class="dialog__panel {size}"><div class="dialog__header">{icon_html}<div style="flex: 1;"><h2 class="dialog__title" id="{labelledby}">{title}</h2>{d}</div>{c}</div>'
            f'<div class="dialog__body stack">{body}</div>{f}</div></div>')


def inert(page_html):
    """Page behind a dialog: visible for context, not interactive."""
    return f'<div inert aria-hidden="true">{page_html}</div>'


def field(label, input_html, help="", error="", fid="", optional=False):
    opt = ' <span class="optional">(optional)</span>' if optional else ""
    h = f'<span class="field__help" id="{fid}-help">{help}</span>' if help else ""
    e = f'<span class="field__error" id="{fid}-error">{error}</span>' if error else ""
    return f'<div class="field"><label class="field__label" for="{fid}">{label}{opt}</label>{input_html}{h}{e}</div>'


def inp(fid, value="", type="text", ph="", invalid=False, help=False, extra="", cls="input"):
    desc = []
    if help: desc.append(f"{fid}-help")
    if invalid: desc.append(f"{fid}-error")
    d = f' aria-describedby="{" ".join(desc)}"' if desc else ""
    iv = ' aria-invalid="true"' if invalid else ""
    v = f' value="{esc(value)}"' if value else ""
    p = f' placeholder="{esc(ph)}"' if ph else ""
    return f'<input class="{cls}" id="{fid}" name="{fid}" type="{type}"{v}{p}{iv}{d}{extra}>'


def note(text, style="top: 6rem; right: 1rem;"):
    return f'<p class="mock-note" style="{style}">{text}</p>'


# ---------------------------------------------------------------- rendering
def mock_bar(sc, current):
    lis = "".join(f'<li><a href="{st}.html"{CUR if st == current else ""}>{st}</a></li>' for st in sc["states"])
    return (f'<nav class="mock-bar" aria-label="Mock navigation"><a class="mock-bar__home" href="../../index.html" aria-label="All mocks">⌂</a>'
            f'<span class="mock-bar__screen">{esc(sc["title"])}</span><ul class="mock-bar__states">{lis}</ul>'
            f'<button type="button" data-theme-toggle aria-pressed="false">☾ Dark</button>'
            f'<button type="button" data-chrome-toggle aria-label="Hide mock chrome">×</button></nav>')


def render(sc, st):
    fn, desc = sc["states"][st]
    body = fn()
    title = f'{sc["title"]} · {st} — 6ixstack mocks'
    return f"""<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="mock:kind" content="{sc["kind"]}">
<meta name="mock:screen" content="{sc["id"]}">
<meta name="mock:state" content="{st}">
<meta name="description" content="{esc(desc)}">
<link rel="icon" type="image/svg+xml" href="../../assets/favicon.svg">
<link rel="stylesheet" href="../../assets/tokens.css">
<link rel="stylesheet" href="../../assets/ui.css">
<link rel="stylesheet" href="../../assets/mock.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
{body}
{mock_bar(sc, st)}
<script src="../../assets/mock.js"></script>
</body>
</html>
"""


def build(only=None):
    count = 0
    for sc in SCREENS.values():
        if only and sc["id"] not in only:
            continue
        for st in sc["states"]:
            out = ROOT / FOLDERS[sc["kind"]] / sc["id"] / f"{st}.html"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(render(sc, st), encoding="utf-8")
            count += 1
    screens = []
    for sc in SCREENS.values():
        d = {"id": sc["id"], "kind": sc["kind"], "title": sc["title"]}
        if sc["route"]: d["route"] = sc["route"]
        if sc["opens_from"]: d["opens_from"] = sc["opens_from"]
        d["states"] = list(sc["states"])
        if sc["na"]: d["not_applicable"] = sc["na"]
        screens.append(d)
    manifest = {"project": "6ixstack", "source": "https://project-6ixstack-event-platform-597.magicpatterns.app",
                "required_states": {"page": ["default", "loading", "empty", "error"], "dialog": ["default", "busy", "invalid"],
                                    "notification": ["info", "success", "warning", "danger"]},
                "screens": screens}
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return count
