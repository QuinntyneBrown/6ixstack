"""Organizer and moderation: sign in, submit/edit events, dashboard, review queue, notifications, settings."""
from core import *

CHECKED = " checked"
SELECTED = " selected"


def sel(fid, options, value=None, invalid=False, help=False, extra=""):
    desc = []
    if help: desc.append(f"{fid}-help")
    if invalid: desc.append(f"{fid}-error")
    d = f' aria-describedby="{" ".join(desc)}"' if desc else ""
    iv = ' aria-invalid="true"' if invalid else ""
    opts = "".join(f'<option{SELECTED if o == value else ""}>{esc(o)}</option>' for o in options)
    return f'<select class="select" id="{fid}" name="{fid}"{iv}{d}{extra}>{opts}</select>'


def txt(fid, value="", rows=4, invalid=False, help=False, ph=""):
    desc = []
    if help: desc.append(f"{fid}-help")
    if invalid: desc.append(f"{fid}-error")
    d = f' aria-describedby="{" ".join(desc)}"' if desc else ""
    iv = ' aria-invalid="true"' if invalid else ""
    p = f' placeholder="{esc(ph)}"' if ph else ""
    return f'<textarea class="textarea" id="{fid}" name="{fid}" rows="{rows}"{iv}{d}{p}>{esc(value)}</textarea>'


def summary(errors, title=None):
    n = len(errors)
    title = title or f'Fix {n} thing{"s" if n != 1 else ""} before you continue'
    items = "".join(f'<li><a href="#{fid}">{msg}</a></li>' for fid, msg in errors)
    return (f'<div class="alert alert--danger form-summary" role="alert" tabindex="-1" id="error-summary">{icon("alert")}'
            f'<div class="alert__body"><p class="alert__title">{title}</p><ul>{items}</ul></div></div>')


def busy_btn(label, busy_label, busy=False, cls="btn btn--primary", typ="submit"):
    if busy:
        return f'<button class="{cls}" type="{typ}" aria-busy="true">{busy_label}</button>'
    return f'<button class="{cls}" type="{typ}">{label}</button>'


# ======================================================================= sign in
screen("sign-in", "page", "Organizer sign in", route="/sign-in",
       na={"loading": "Nothing to load; the form renders immediately.", "empty": "Single form, no collection."})


def sign_in_page(inner):
    main = (f'<div class="auth-layout" style="min-height: auto; padding-block: var(--space-16);"><div class="auth-card">'
            f'<div class="form-card">{inner}</div>'
            f'<p class="text-caption" style="margin-top: var(--space-4); text-align: center;">No account needed to <a href="{P("submit-event")}">submit an event</a>. Sign in to edit your listings and see who is coming.</p>'
            f'</div></div>')
    return shell(main, submit=False)


def sign_in_form(value="", invalid=False, busy=False, err_msg="Enter an email address like name@example.com."):
    dis = " disabled" if busy else ""
    f = field("Email", inp("email", value, "email", "name@example.com", invalid=invalid, help=True,
                           extra=' autocomplete="email" required' + ("" if busy else " autofocus") + (" readonly" if busy else "")),
              "Use the address you list events with.", err_msg if invalid else "", fid="email")
    s = summary([("email", err_msg)], "Check your email address") if invalid else ""
    return (f'<h1 style="font: var(--text-h2);">Sign in to 6ixstack</h1>'
            f'<p class="text-muted" style="margin-top: var(--space-2); margin-bottom: var(--space-6);">We’ll email you a link that signs you in. No password to remember.</p>'
            f'{s}<form class="stack" action="{P("sign-in", "success")}" novalidate><fieldset class="stack"{dis}>{f}</fieldset>'
            f'{busy_btn("Email me a sign-in link", "Sending link…", busy, "btn btn--primary btn--lg btn--block")}</form>')


@state("sign-in", "default", "Magic-link sign in for organizers: one email field, autofocused.")
def _():
    return sign_in_page(sign_in_form())


@state("sign-in", "invalid", "Email missing its domain: summary at the top, inline error, input kept.")
def _():
    return sign_in_page(sign_in_form("priya@gtaazure", invalid=True)) + note("Focus moves to the error summary on submit; each item links to its field.", "top: 6rem; right: 1rem;")


@state("sign-in", "submitting", "Sending the link: field read-only, button busy, no layout shift.")
def _():
    return sign_in_page(sign_in_form(ME["email"], busy=True))


@state("sign-in", "success", "Link sent: names the inbox, says how long the link lasts and offers a resend.")
def _():
    inner = (f'<div class="success-panel"><div class="success-panel__icon">{icon("mail", "icon icon--lg")}</div>'
             f'<h1 style="font: var(--text-h2);">Check your inbox</h1>'
             f'<p class="text-muted">We sent a sign-in link to <strong>{ME["email"]}</strong>. It works once and expires in 15 minutes.</p>'
             f'<p class="text-caption">Nothing there after a minute? Check spam, or ask for another link.</p>'
             f'<div class="cluster"><button class="btn" type="button" disabled>Resend link in 30s</button><a class="btn btn--ghost" href="{P("sign-in")}">Use a different email</a></div></div>')
    return sign_in_page(inner) + note("Resend is disabled for 30 seconds after each send, with a countdown in the button.", "top: 6rem; right: 1rem;")


@state("sign-in", "error", "The magic link was already used or has expired: explain and send a fresh one.")
def _():
    inner = (alert("danger", "That sign-in link has expired", "Links work once and last 15 minutes. Enter your email and we’ll send a new one.", role="alert")
             + '<div style="margin-top: var(--space-6);"></div>' + sign_in_form(ME["email"]))
    return sign_in_page(inner)


# ======================================================================= submit event
screen("submit-event", "page", "Submit an event", route="/submit", na={"empty": "A form with no collection to be empty."})

SUB = dict(title="Fabric for Power BI developers", org="GTA Azure Community",
           desc="Move your Power BI reports onto Fabric without rewriting them. Semantic models, Direct Lake and deployment pipelines, with time for your questions.",
           topics=("azure", "ai"), date="2026-11-18", start="18:30", end="20:30", fmt="in-person", venue="Microsoft Canada",
           address="81 Bay St, 17th floor", city="Toronto", stream="", paid=False, price="", ticket="https://lu.ma/fabric-pbi-gta", email=ME["email"])
CITIES = ["Toronto", "Mississauga", "Brampton", "Markham", "Vaughan", "Oakville", "Richmond Hill", "Online only"]
ZONES = ["America/Toronto (ET)", "America/Vancouver (PT)", "America/Denver (MT)", "Europe/London (GMT)", "Europe/Paris (CET)"]


def event_form(v, errors=None, disabled=False, include_email=True, prefix="ev"):
    errors = errors or {}
    def er(k): return errors.get(k, "")
    def iv(k): return k in errors
    topics_err = er("topics")
    tiv = ' aria-invalid="true" aria-describedby="topics-error"' if topics_err else ""
    boxes = "".join(
        f'<label class="choice"><input type="checkbox" name="topics" value="{k}"{CHECKED if k in v["topics"] else ""}{tiv}{" id=" + chr(34) + "topics" + chr(34) if i == 0 else ""}>'
        f'<span class="choice__text"><span class="topic-tag" style="color: var(--color-fg-default);"><span class="topic-dot topic-dot--{k}" aria-hidden="true"></span>{t}</span></span></label>'
        for i, (k, t) in enumerate(TOPICS))
    tE = f'<span class="field__error" id="topics-error">{topics_err}</span>' if topics_err else ""
    fmts = [("in-person", "In person", "At a venue in the GTA"), ("streaming", "Streaming", "Online only"), ("hybrid", "Hybrid", "Venue plus a livestream")]
    cards = "".join(
        f'<label class="choice-card choice"><input type="radio" name="format" value="{k}"{CHECKED if v["fmt"] == k else ""}><span class="choice__text">{t}<small>{s}</small></span></label>'
        for k, t, s in fmts)
    basics = (f'<section class="form-section" aria-labelledby="sec-basics"><h2 id="sec-basics">Event basics</h2><p>This is what people see in the list.</p><div class="form-grid">'
              + field("Event title", inp("title", v["title"], invalid=iv("title"), help=True, extra=' maxlength="90" required'), "Up to 90 characters. Say what people will learn.", er("title"), fid="title")
              + field("Community or organizer", inp("org", v["org"], invalid=iv("org"), extra=' autocomplete="organization" required'), "", er("org"), fid="org")
              + field("Description", txt("desc", v["desc"], 4, invalid=iv("desc"), help=True), "Two or three sentences. Markdown links are fine.", er("desc"), fid="desc")
              + f'<fieldset><legend>Topics</legend><div class="form-grid form-grid--3" style="margin-top: 0; gap: var(--space-2);">{boxes}</div>{tE}</fieldset></div></section>')
    when = (f'<section class="form-section" aria-labelledby="sec-when"><h2 id="sec-when">When</h2><p>Times are shown to everyone in Toronto time, with your time zone alongside for streams.</p><div class="form-grid form-grid--2">'
            + field("Date", inp("date", v["date"], "date", invalid=iv("date"), extra=" required"), "", er("date"), fid="date")
            + field("Time zone", sel("tz", ZONES, ZONES[0]), fid="tz")
            + field("Starts", inp("start", v["start"], "time", invalid=iv("start"), extra=" required"), "", er("start"), fid="start")
            + field("Ends", inp("end", v["end"], "time", invalid=iv("end")), "", er("end"), fid="end")
            + '</div></section>')
    where = (f'<section class="form-section" aria-labelledby="sec-where"><h2 id="sec-where">Where</h2><fieldset style="margin-top: var(--space-5);"><legend>Format</legend><div class="choice-cards">{cards}</div></fieldset>'
             f'<div class="form-grid form-grid--2">'
             + (field("Venue name", inp("venue", v["venue"], invalid=iv("venue")), "", er("venue"), fid="venue")
                + field("City", sel("city", CITIES, v["city"]), fid="city")
                + f'<div class="span-2">' + field("Street address", inp("address", v["address"], invalid=iv("address"), help=True, extra=' autocomplete="street-address"'), "Include the floor or room so people find you.", er("address"), fid="address") + '</div>'
                if v["fmt"] != "streaming" else "")
             # L2-042: in person has no livestream link; streaming has no venue.
             + (f'<div class="span-2">' + field("Livestream link", inp("stream", v["stream"], "url", "https://youtube.com/live/…", invalid=iv("stream"), help=True), "Shown 15 minutes before start.", er("stream"), fid="stream", optional=True) + '</div>'
                if v["fmt"] != "in-person" else "")
             + '</div></section>')
    paid = v["paid"]
    tickets = (f'<section class="form-section" aria-labelledby="sec-tickets"><h2 id="sec-tickets">Tickets</h2><fieldset style="margin-top: var(--space-5);"><legend>Price</legend><div class="choice-row">'
               f'<label class="choice"><input type="radio" name="paid" value="free"{"" if paid else CHECKED}><span class="choice__text">Free</span></label>'
               f'<label class="choice"><input type="radio" name="paid" value="paid"{CHECKED if paid else ""}><span class="choice__text">Paid</span></label></div></fieldset>'
               f'<div class="form-grid form-grid--2">'
               + field("Price (CAD)", f'<div class="input-group"><span class="addon">$</span>{inp("price", v["price"], "text", "", invalid=iv("price"), extra=" inputmode=" + chr(34) + "decimal" + chr(34) + ("" if paid else " disabled"))}</div>', "", er("price"), fid="price")
               + field("Registration or ticket link", inp("ticket", v["ticket"], "url", "https://", invalid=iv("ticket"), help=True), "Meetup, Luma, Eventbrite or your own site.", er("ticket"), fid="ticket", optional=True)
               + '</div></section>')
    contact = ""
    if include_email:
        contact = (f'<section class="form-section" aria-labelledby="sec-contact"><h2 id="sec-contact">Your contact email</h2><p>Only moderators see it. We’ll tell you when the event is live.</p><div class="form-grid">'
                   + field("Email", inp("email", v["email"], "email", "name@example.com", invalid=iv("email"), extra=' autocomplete="email" required'), "", er("email"), fid="email")
                   + '</div></section>')
    dis = " disabled" if disabled else ""
    return f'<fieldset{dis} style="display: block;">{basics}{when}{where}{tickets}{contact}</fieldset>'


def submit_page(form_html, busy=False, top=""):
    actions = (f'<div class="form-actions"><a class="btn" href="{P("events")}">Cancel</a>'
               f'{busy_btn("Submit for review", "Submitting…", busy)}</div>')
    main = (f'<div class="page--narrow" style="margin-inline: auto;"><div class="page-title"><h1>Submit an event</h1>'
            f'<p class="lead">Free to list. A moderator checks every event within a day, then it shows up in the list, the calendar and everyone’s feeds.</p></div>'
            f'{top}<form class="form-card" action="{P("submit-event", "success")}" novalidate>{form_html}{actions}</form>'
            f'<p class="text-caption" style="margin-top: var(--space-4);">By submitting you agree that the event follows the <a href="{P("code-of-conduct")}">code of conduct</a>.</p></div>')
    return shell(main, submit=False)


@state("submit-event", "default", "Event submission form: basics, when, where, tickets and contact email, prefilled mid-entry.")
def _():
    return submit_page(event_form(SUB)) + note("Picking Streaming hides venue and address; Hybrid shows both. The form saves a draft locally as you type.", "top: 20rem; right: 1rem;")


@state("submit-event", "loading", "Topic and city lists loading: form skeleton keeps the final layout.")
def _():
    sec = lambda n: (f'<div class="form-section" aria-hidden="true">{sk("30%", "1.4rem", "skeleton--title")}{sk("60%", "0.9rem")}<div class="form-grid">'
                     + "".join(f'<div>{sk("25%", "0.9rem")}{sk("100%", "2.5rem", "skeleton--rect")}</div>' for _ in range(n)) + '</div></div>')
    form = f'<div aria-busy="true">{sec(3)}{sec(2)}{sec(3)}</div>'
    main = (f'<div class="page--narrow" style="margin-inline: auto;"><div class="page-title"><h1>Submit an event</h1>'
            f'<p class="lead">Free to list. A moderator checks every event within a day, then it shows up in the list, the calendar and everyone’s feeds.</p></div>'
            f'<div class="form-card">{form}</div></div>')
    return shell(main, submit=False)


@state("submit-event", "error", "Submission failed on the server: error at the top, every input preserved, retry.")
def _():
    top = alert("danger", "We couldn’t submit your event", "6ixstack didn’t respond. Everything you entered is still here; submit again in a moment.", role="alert") + '<div style="height: var(--space-6);"></div>'
    return submit_page(event_form(SUB), top=top)


@state("submit-event", "invalid", "Submitted with missing title, no topic and an end time before the start: summary plus inline errors.")
def _():
    v = dict(SUB, title="", topics=(), end="17:30")
    errs = {"title": "Enter a title for the event.", "topics": "Pick at least one topic so people can find it.", "end": "End time must be after the 6:30 PM start."}
    top = summary([("title", errs["title"]), ("topics", errs["topics"]), ("end", errs["end"])])
    return submit_page(event_form(v, errs), top=top) + note("On submit, focus moves to the summary; each link jumps to its field.", "top: 16rem; right: 1rem;")


@state("submit-event", "submitting", "Submitting: fields locked, primary button busy, nothing moves.")
def _():
    return submit_page(event_form(SUB, disabled=True), busy=True)


@state("submit-event", "success", "Submitted: says it is in review, what happens next and when.")
def _():
    inner = (f'<div class="success-panel"><div class="success-panel__icon">{icon("check-circle", "icon icon--lg")}</div>'
             f'<h2 style="font: var(--text-h3);">Thanks — “Fabric for Power BI developers” is in review</h2>'
             f'<p class="text-muted">We sent a confirmation to <strong>{ME["email"]}</strong>.</p>'
             f'<ol class="steps-next"><li><span>A moderator checks the details, usually within a day.</span></li>'
             f'<li><span>We email you when it’s live, or what to fix if something is missing.</span></li>'
             f'<li><span>It appears in the list, the calendar and every matching feed.</span></li></ol>'
             f'<div class="cluster"><a class="btn btn--primary" href="{P("events")}">Back to events</a><a class="btn" href="{P("submit-event")}">Submit another event</a>'
             f'<a class="btn btn--ghost" href="{P("sign-in")}">Sign in to manage it</a></div></div>')
    main = (f'<div class="page--narrow" style="margin-inline: auto;"><div class="page-title"><h1>Submit an event</h1></div>'
            f'<div class="form-card">{inner}</div></div>')
    return shell(main, submit=False)


# ======================================================================= organizer dashboard
screen("organizer-dashboard", "page", "Your events", route="/organize")

MY_EVENTS = [
    ("Azure Data & AI Day GTA", "Thu, Nov 5 · 9:00 AM", "published", "Published", "318"),
    ("Fabric for Power BI developers", "Wed, Nov 18 · 6:30 PM", "review", "In review", "–"),
    ("Copilot Studio for makers", "Thu, Dec 3 · 6:00 PM", "draft", "Draft", "–"),
    ("Azure Bicep clinic", "Tue, Nov 24 · 6:00 PM", "rejected", "Needs changes", "–"),
    ("Azure meetup: October social", "Thu, Oct 15 · 6:30 PM", "past", "Past", "96"),
]


def stats(vals=("1", "1", "318", "1,204")):
    labels = ("Upcoming", "In review", "Going", "Feed subscribers")
    return '<div class="stats-row">' + "".join(
        f'<div class="stat"><span class="stat__label">{l}</span><span class="stat__value">{v}</span></div>' for l, v in zip(labels, vals)) + '</div>'


def events_table(rows=MY_EVENTS, hover_first=True):
    body = ""
    for i, (t, d, k, s, g) in enumerate(rows):
        hv = HOVER if hover_first and i == 0 else ""
        acts = f'<a class="btn btn--sm" href="{P("edit-event", "read-only" if k == "past" else "default")}">{icon("edit")}{"View" if k == "past" else "Edit"}</a>'
        if k in ("published", "review"):
            acts += f' <a class="btn btn--sm btn--ghost" href="{D("cancel-event")}">Cancel<span class="visually-hidden"> {esc(t)}</span></a>'
        title = f'<a href="{P("event-detail")}">{esc(t)}</a>' if k == "published" else esc(t)
        reason = '<div class="list__meta">Add the venue address</div>' if k == "rejected" else ""
        body += (f'<tr{hv}><td><div class="list__title">{title}</div>{reason}</td><td style="white-space: nowrap;">{d}</td>'
                 f'<td><span class="status status--{k}">{s}</span></td><td class="num">{g}</td><td class="row-actions" style="white-space: nowrap;">{acts}</td></tr>')
    return (f'<div class="table-wrap"><table class="table"><caption class="visually-hidden">Your events</caption><thead><tr>'
            f'<th scope="col">Event</th><th scope="col" aria-sort="ascending"><button type="button">Date</button></th><th scope="col">Status</th><th scope="col" class="num">Going</th>'
            f'<th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>{body}</tbody></table></div>')


def dash_page(content, banner="", stats_html=None, sub="GTA Azure Community · signed in as priya@gtaazure.ca"):
    stats_html = stats() if stats_html is None else stats_html
    main = (f'<div class="page-title cluster cluster--between" style="align-items: flex-end;"><div><h1>Your events</h1><p class="lead">{sub}</p></div>'
            f'<a class="btn btn--primary" href="{P("submit-event")}">{icon("plus")}New event</a></div>{banner}{stats_html}{content}')
    return shell(main, user="organizer", submit=False)


@state("organizer-dashboard", "default", "Priya's events: stats, then every listing with its review status and row actions.")
def _():
    return dash_page(events_table()) + note("Row actions show on hover and focus; on touch they are always visible.", "top: 26rem; right: 1rem;")


@state("organizer-dashboard", "loading", "Stats and table rows as skeletons with the same column widths.")
def _():
    st = '<div class="stats-row" aria-hidden="true">' + "".join(f'<div class="stat">{sk("60%", "0.9rem")}{sk("40%", "1.8rem", "skeleton--rect")}</div>' for _ in range(4)) + '</div>'
    rows = "".join(f'<tr aria-hidden="true"><td>{sk("80%")}</td><td>{sk("70%")}</td><td>{sk("5rem")}</td><td class="num">{sk("2rem")}</td><td>{sk("4rem", "1.8rem", "skeleton--rect")}</td></tr>' for _ in range(4))
    table = (f'<div class="table-wrap" aria-busy="true"><table class="table"><caption class="visually-hidden">Your events, loading</caption><thead><tr>'
             f'<th scope="col">Event</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col" class="num">Going</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>{rows}</tbody></table></div>')
    return dash_page(table, stats_html=st)


@state("organizer-dashboard", "empty", "A first-time organizer with nothing listed: what this page is for and one action.")
def _():
    e = empty("calendar-plus", "List your first event",
              "Events you submit show up here with their review status, how many people are going and how many feeds include them.",
              f'<a class="btn btn--primary" href="{P("submit-event")}">{icon("plus")}Submit an event</a>')
    return dash_page(f'<div class="form-card">{e}</div>', stats_html="", sub="GTA Azure Community · signed in as priya@gtaazure.ca")


@state("organizer-dashboard", "error", "Events failed to load: the chrome stays, with retry and a support contact.")
def _():
    a = alert("danger", "We couldn’t load your events", "Your listings are safe; this is a problem on our side.",
              f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button><a href="{P("contact")}">Contact us</a>', role="alert")
    return dash_page(a, stats_html="")


# ======================================================================= edit event
screen("edit-event", "page", "Edit event", route="/organize/events/:id/edit", na={"empty": "Editing always starts from an existing event."})

DAY = dict(title="Azure Data & AI Day GTA", org="GTA Azure Community",
           desc="A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track.",
           topics=("azure", "ai"), date="2026-11-05", start="09:00", end="17:00", fmt="hybrid", venue="Living Arts Centre",
           address="4141 Living Arts Dr, Hall B for labs", city="Mississauga", stream="https://youtube.com/live/gta-azure-day", paid=True, price="49.00",
           ticket="https://tickets.example.org/azure-data-ai-day", email=ME["email"])


def edit_page(form_html, top="", busy=False, title="Edit event", lead=None, actions=True):
    lead = lead or 'Changes go live right away. People who added it to their calendar or follow it get an update.'
    acts = ""
    if actions:
        acts = (f'<div class="form-actions" style="justify-content: space-between;"><a class="btn btn--ghost" href="{D("cancel-event")}" style="color: var(--color-danger-fg);">{icon("trash")}Cancel event</a>'
                f'<div class="cluster"><a class="btn" href="{P("organizer-dashboard")}">Discard changes</a>{busy_btn("Save changes", "Saving…", busy)}</div></div>')
    main = (f'<a class="back-link" href="{P("organizer-dashboard")}">{icon("arrow-left", "icon icon--sm")}Your events</a>'
            f'<div class="page--narrow" style="margin-inline: auto; padding-inline: 0;"><div class="page-title" style="padding-top: var(--space-6);"><h1>{title}</h1><p class="lead">{lead}</p></div>'
            f'{top}<form class="form-card" action="{P("edit-event", "success")}" novalidate>{form_html}{acts}</form></div>')
    return shell(main, user="organizer", submit=False)


@state("edit-event", "default", "Azure Data & AI Day GTA prefilled for editing; Cancel event is a separate, red, secondary action.")
def _():
    top = f'<p class="inline-status inline-status--success" style="margin-bottom: var(--space-4);"><span class="dot" aria-hidden="true"></span>Published · 318 going · last edited Oct 28</p>'
    return edit_page(event_form(DAY, include_email=False), top)


@state("edit-event", "loading", "Edit form skeleton while the event loads.")
def _():
    sec = lambda n: (f'<div class="form-section" aria-hidden="true">{sk("30%", "1.4rem", "skeleton--title")}<div class="form-grid">'
                     + "".join(f'<div>{sk("25%", "0.9rem")}{sk("100%", "2.5rem", "skeleton--rect")}</div>' for _ in range(n)) + '</div></div>')
    return edit_page(f'<div aria-busy="true">{sec(3)}{sec(2)}{sec(3)}</div>', actions=False, lead="Loading Azure Data & AI Day GTA…")


@state("edit-event", "error", "The event couldn't be loaded for editing: retry or go back to your events.")
def _():
    main = (f'<a class="back-link" href="{P("organizer-dashboard")}">{icon("arrow-left", "icon icon--sm")}Your events</a>'
            + empty("alert", "We couldn’t open this event", "The listing is safe and still published. Try again in a moment.",
                    f'<button class="btn btn--primary" type="button">{icon("refresh")}Try again</button><a class="btn" href="{P("organizer-dashboard")}">Back to your events</a>', error=True, heading="h1"))
    return shell(main, user="organizer", submit=False)


@state("edit-event", "invalid", "Saved with a broken ticket link and a blank address on a hybrid event: summary plus inline errors.")
def _():
    v = dict(DAY, address="", ticket="tickets.example.org/azure-data-ai-day")
    errs = {"address": "Enter the street address for the venue.", "ticket": "Enter a full link that starts with https://"}
    return edit_page(event_form(v, errs, include_email=False), summary([("address", errs["address"]), ("ticket", errs["ticket"])]))


@state("edit-event", "submitting", "Saving: fields locked and the Save button busy.")
def _():
    return edit_page(event_form(DAY, disabled=True, include_email=False), busy=True)


@state("edit-event", "success", "Saved: confirms the change and who gets told about it.")
def _():
    top = alert("success", "Changes saved", "The listing is updated. 318 people going and 41 feeds that include it will see the new details within an hour.",
                f'<a href="{P("event-detail")}">View the listing</a>', close=True, role="status") + '<div style="height: var(--space-6);"></div>'
    return edit_page(event_form(DAY, include_email=False), top)


@state("edit-event", "read-only", "A past event: details are locked, the reason is shown, and a duplicate action is offered.")
def _():
    v = dict(DAY, title="Azure meetup: October social", date="2026-10-15", start="18:30", end="21:00", fmt="in-person", venue="Spaces", address="1 University Ave, 3rd floor",
             city="Toronto", stream="", paid=False, price="", desc="Pizza, lightning talks and a look at what’s new in Azure from Ignite.", topics=("azure",))
    top = alert("info", "This event has ended, so it can’t be edited", "Past events stay on 6ixstack as a record. Want to run it again?",
                f'<a href="{P("submit-event")}">Duplicate as a new event</a>') + '<div style="height: var(--space-6);"></div>'
    return edit_page(event_form(v, disabled=True, include_email=False), top, title="Azure meetup: October social", lead="Thursday, October 15, 2026 · 96 attended", actions=False)


# ======================================================================= review queue
screen("review-queue", "page", "Review queue", route="/admin/review")

QUEUE = [
    dict(title="Rust in production at scale", org="Toronto Rust Meetup", when="Tue, Nov 17 · 6:30 PM", where="Shopify, 620 King St W, Toronto", topics=[], submitted="2 hours ago · organizers@torontorust.ca",
         checks=[("ok", "Venue address found"), ("ok", "Link reachable"), ("ok", "No duplicates")]),
    dict(title="Kubernetes on a budget", org="Cloud Native Toronto", when="Thu, Nov 19 · 6:00 PM", where="Streaming online", topics=["azure", "aws"], submitted="5 hours ago · hello@cloudnativeto.ca",
         checks=[("ok", "Stream link reachable"), ("warn", "Possible duplicate of a Nov 19 listing"), ("ok", "Organizer has 6 approved events")]),
    dict(title="Fabric for Power BI developers", org="GTA Azure Community", when="Wed, Nov 18 · 6:30 PM", where="Microsoft Canada, 81 Bay St, Toronto", topics=["azure", "ai"], submitted="Yesterday · priya@gtaazure.ca",
         checks=[("ok", "Venue address found"), ("ok", "Link reachable"), ("ok", "Trusted organizer")]),
    dict(title="Free crypto trading masterclass", org="WealthFast Academy", when="Sat, Nov 14 · 2:00 PM", where="Address not given", topics=[], submitted="Yesterday · promo@wealthfast.biz",
         checks=[("warn", "No venue address"), ("warn", "Not a developer topic"), ("warn", "First submission from this sender")]),
]


def review_card(q, hover=False):
    ck = "".join(f'<li>{icon("check-circle" if k == "ok" else "warning", "icon icon--sm " + k)}{t}</li>' for k, t in q["checks"])
    tags = "".join(topic_tag(t) for t in q["topics"]) or '<span class="topic-tag">No topic picked</span>'
    hv = HOVER if hover else ""
    return (f'<li class="review-card"{hv}><div style="min-width: 0;"><h2>{esc(q["title"])}</h2><p class="text-muted">{esc(q["org"])}</p>'
            f'<div class="event-row__meta"><span class="meta-item">{icon("calendar")}{q["when"]}</span><span class="meta-item">{icon("pin")}{esc(q["where"])}</span>{tags}</div>'
            f'<ul class="check-list" aria-label="Automatic checks">{ck}</ul><p class="text-caption" style="margin-top: var(--space-2);">Submitted {q["submitted"]}</p></div>'
            f'<div class="review-card__actions"><a class="btn btn--primary btn--sm" href="{N("moderation-toast", "success")}">{icon("check")}Approve</a>'
            f'<a class="btn btn--sm" href="{P("edit-event")}">{icon("edit")}Edit</a>'
            f'<a class="btn btn--sm btn--ghost" href="{D("reject-submission")}">Reject<span class="visually-hidden"> {esc(q["title"])}</span></a></div></li>')


def queue_page(content, sub="4 waiting · oldest submitted yesterday · median review time 3 h", user="moderator", unread=2):
    main = (f'<div class="page-title"><h1>Review queue</h1><p class="lead">{sub}</p></div>{content}')
    return shell(main, user=user, unread=unread, submit=False)


@state("review-queue", "default", "Four submissions with automatic checks; approve, edit or reject each in place.")
def _():
    return queue_page('<ul class="review-list">' + "".join(review_card(q, i == 0) for i, q in enumerate(QUEUE)) + '</ul>') + note(
        "Keyboard: J/K moves between cards, A approves, R opens Reject. Shortcuts are listed under ? .", "top: 12rem; right: 1rem;")


@state("review-queue", "loading", "Review cards as skeletons matching the card layout.")
def _():
    card = (f'<li class="review-card" aria-hidden="true"><div>{sk("50%", "1.4rem", "skeleton--title")}{sk("30%")}{sk("70%", "0.9rem")}{sk("60%", "0.9rem")}</div>'
            f'<div class="review-card__actions">{sk("5rem", "2rem", "skeleton--rect")}{sk("4rem", "2rem", "skeleton--rect")}</div></li>')
    return queue_page(f'<ul class="review-list" aria-busy="true">{card * 3}</ul>', sub="Loading submissions…")


@state("review-queue", "empty", "Nothing waiting: all caught up, with a link to recently approved events.")
def _():
    return queue_page(empty("check-circle", "All caught up", "No submissions are waiting. New ones show up here and in your notifications.",
                            f'<a class="btn" href="{P("events")}">See what’s live</a>'), sub="0 waiting · last approval 12 minutes ago")


@state("review-queue", "error", "Queue failed to load: chrome stays, retry offered.")
def _():
    return queue_page(alert("danger", "We couldn’t load the queue", "Submissions are safe. Nothing is approved or rejected until you act.",
                            f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button>', role="alert"), sub="Queue unavailable")


@state("review-queue", "forbidden", "Priya (an organizer, not a moderator) opens the queue: why she can't, who to ask, a way back.")
def _():
    return queue_page(empty("lock", "Only moderators can review submissions",
                            "You’re signed in as Priya Natarajan, an organizer. To help moderate, ask the 6ixstack team.",
                            f'<a class="btn btn--primary" href="{P("organizer-dashboard")}">Go to your events</a><a class="btn" href="{P("contact")}">Ask to moderate</a>'),
                      sub="You don’t have access to this page", user="organizer", unread=3)


# ======================================================================= notifications
screen("notifications", "page", "Notifications", route="/notifications")

NOTIFS = [
    ("success", "check-circle", "“Fabric for Power BI developers” is live", "Approved by a moderator. It’s in the list, the calendar and 41 feeds.", "12 min ago", P("event-detail"), True),
    ("warning", "flag", "Someone reported the time on Azure Data & AI Day GTA", "“The ticket page says 9:30 AM.” Check and update the listing if needed.", "2 h ago", P("edit-event"), True),
    ("", "rss", "1,204 people now follow your events in a feed", "Up 86 this month.", "Yesterday", P("organizer-dashboard"), True),
    ("danger", "alert", "“Azure Bicep clinic” needs changes", "Reason: the listing is missing a venue address. Edit it and resubmit.", "Oct 29", P("edit-event"), False),
    ("", "users", "Azure Data & AI Day GTA passed 300 going", "Capacity is 400.", "Oct 27", P("event-detail"), False),
]


def notif_list(read_all=False):
    out = ""
    for k, ic, t, txt_, time, href, unread in NOTIFS:
        u = unread and not read_all
        ur = '<span class="visually-hidden"> (unread)</span>' if u else ""
        out += (f'<li class="notif{" notif--unread" if u else ""}"><span class="notif__icon{" notif__icon--" + k if k else ""}">{icon(ic)}</span>'
                f'<div><p class="notif__title"><a href="{href}">{t}</a>{ur}</p><p class="notif__text">{txt_}</p></div>'
                f'<span class="notif__time">{time}</span></li>')
    return f'<ul class="notif-list">{out}</ul>'


def notif_page(content, unread=3, sub=None):
    sub = sub if sub is not None else f"{unread} unread"
    btn = f'<button class="btn btn--sm" type="button">{icon("check")}Mark all as read</button>' if unread else ""
    main = (f'<div class="page--narrow" style="margin-inline: auto; padding-inline: 0;"><div class="page-title cluster cluster--between" style="align-items: flex-end;">'
            f'<div><h1>Notifications</h1><p class="lead">{sub}</p></div>{btn}</div>{content}'
            f'<p class="text-caption" style="margin-top: var(--space-4);">Choose which of these also arrive by email in <a href="{P("settings")}">settings</a>.</p></div>')
    return shell(main, user="organizer", unread=unread, submit=False)


@state("notifications", "default", "Organizer notifications: three unread (approved, report, milestone) above older read items.")
def _():
    return notif_page(notif_list()) + note("Unread items carry an orange dot and bold title; screen readers hear “unread” from the list item label.", "top: 9rem; right: 1rem;")


@state("notifications", "loading", "Notification rows as skeletons.")
def _():
    row = f'<li class="notif" aria-hidden="true">{sk("2.5rem", "2.5rem", "skeleton--circle")}<div>{sk("70%")}{sk("50%", "0.85rem")}</div></li>'
    return notif_page(f'<ul class="notif-list" aria-busy="true">{row * 4}</ul>', unread=0, sub="Loading…")


@state("notifications", "empty", "No notifications yet: says what will show up here.")
def _():
    return notif_page('<div class="form-card">' + empty("bell", "No notifications yet",
                                                         "When moderators review your events or people report a problem, you’ll see it here.",
                                                         f'<a class="btn" href="{P("organizer-dashboard")}">Go to your events</a>') + "</div>", unread=0, sub="Nothing new")


@state("notifications", "error", "Notifications failed to load; retry.")
def _():
    return notif_page(alert("danger", "We couldn’t load notifications", "Try again in a moment. Important updates are also emailed to priya@gtaazure.ca.",
                            f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button>', role="alert"), unread=0, sub="Unavailable")


@state("notifications", "read", "Everything read: no dots, header badge gone, Mark all as read hidden.")
def _():
    return notif_page(notif_list(read_all=True), unread=0, sub="All caught up")


# ======================================================================= settings
screen("settings", "page", "Settings", route="/settings", na={"empty": "Settings always has values; there is no collection."})

PROFILE = dict(name=ME["name"], email=ME["email"], org=ME["org"], site="https://gtaazure.ca")


def settings_form(v=PROFILE, errors=None, disabled=False):
    errors = errors or {}
    er = lambda k: errors.get(k, "")
    prof = (f'<section class="form-section" aria-labelledby="s-profile" id="profile"><h2 id="s-profile">Profile</h2><p>Shown to moderators, not to attendees.</p><div class="form-grid form-grid--2">'
            + field("Name", inp("name", v["name"], invalid="name" in errors, extra=' autocomplete="name"'), "", er("name"), fid="name")
            + field("Email", inp("email", v["email"], "email", invalid="email" in errors, help=True, extra=' autocomplete="email"'), "Changing it sends a confirmation link to the new address.", er("email"), fid="email")
            + field("Community", inp("org", v["org"]), fid="org")
            + field("Website", inp("site", v["site"], "url", invalid="site" in errors), "", er("site"), fid="site", optional=True)
            + '</div></section>')
    sw = [("n-approved", "My event is approved or needs changes", True), ("n-reports", "Someone reports a problem with my event", True),
          ("n-weekly", "Weekly summary of going and feed numbers", False), ("n-digest", "New events from communities I follow", False)]
    sws = "".join(f'<label class="switch" for="{i}"><input type="checkbox" role="switch" id="{i}"{CHECKED if c else ""}><span>{t}</span></label>' for i, t, c in sw)
    notif = (f'<section class="form-section" aria-labelledby="s-notif" id="email-notifications"><h2 id="s-notif">Email notifications</h2><p>Everything still shows in your notifications page.</p>'
             f'<div class="stack" style="margin-top: var(--space-5);">{sws}</div></section>')
    dis = " disabled" if disabled else ""
    return f'<fieldset{dis} style="display: block;">{prof}{notif}</fieldset>'


def settings_page(form_html, top="", busy=False):
    nav = "".join(f'<a class="nav-link" href="#{a}"{CUR if a == "profile" else ""}>{t}</a>' for a, t in
                  (("profile", "Profile"), ("email-notifications", "Email notifications"), ("community", "Community"), ("account", "Account")))
    comm = (f'<section class="form-card" aria-labelledby="s-comm" id="community" style="margin-top: var(--space-6);"><h2 id="s-comm" style="font: var(--text-h4);">Community</h2>'
            f'<p class="text-muted" style="margin-top: var(--space-1);">You manage <a href="{P("community-detail")}">GTA Azure Community</a> with 2 co-organizers.</p></section>')
    acct = (f'<section class="danger-zone" aria-labelledby="s-acct" id="account" style="margin-top: var(--space-6);"><h2 id="s-acct">Account</h2>'
            f'<p>Signing out ends this session only. Deleting your account removes your organizer access; published events stay up under GTA Azure Community.</p>'
            f'<div class="cluster" style="margin-top: var(--space-4);"><a class="btn" href="{D("sign-out")}">{icon("log-out")}Sign out</a>'
            f'<a class="btn btn--danger" href="{D("delete-account")}">{icon("trash")}Delete account</a></div></section>')
    form = (f'{top}<form class="form-card" action="{P("settings", "success")}" novalidate>{form_html}'
            f'<div class="form-actions">{busy_btn("Save settings", "Saving…", busy)}</div></form>{comm}{acct}')
    main = (f'<div class="page-title"><h1>Settings</h1><p class="lead">Signed in as {ME["email"]}</p></div>'
            f'<div class="settings-layout"><nav class="settings-nav" aria-label="Settings sections">{nav}</nav><div style="min-width: 0;">{form}</div></div>')
    return shell(main, user="organizer", submit=False)


@state("settings", "default", "Profile, email notification switches, community and the account danger zone.")
def _():
    return settings_page(settings_form())


@state("settings", "loading", "Settings form skeleton.")
def _():
    f = '<div aria-busy="true">' + "".join(f'<div style="margin-bottom: var(--space-5);" aria-hidden="true">{sk("20%", "0.9rem")}{sk("100%", "2.5rem", "skeleton--rect")}</div>' for _ in range(4)) + '</div>'
    main = (f'<div class="page-title"><h1>Settings</h1><p class="lead">Loading your settings…</p></div>'
            f'<div class="settings-layout"><nav class="settings-nav" aria-label="Settings sections"><a class="nav-link" href="#main" aria-current="page">Profile</a></nav><div class="form-card">{f}</div></div>')
    return shell(main, user="organizer", submit=False)


@state("settings", "error", "Settings failed to load: retry; nothing has been changed.")
def _():
    main = (f'<div class="page-title"><h1>Settings</h1></div>' + alert("danger", "We couldn’t load your settings", "Nothing has been changed. Try again in a moment.",
                                                                       f'<button type="button">{icon("refresh", "icon icon--sm")} Try again</button>', role="alert"))
    return shell(main, user="organizer", submit=False)


@state("settings", "invalid", "Blank name and a malformed website: summary at the top, inline errors, input kept.")
def _():
    v = dict(PROFILE, name="", site="gtaazure")
    errs = {"name": "Enter your name.", "site": "Enter a full link like https://gtaazure.ca"}
    return settings_page(settings_form(v, errs), summary([("name", errs["name"]), ("site", errs["site"])]))


@state("settings", "submitting", "Saving settings: fields locked, Save busy.")
def _():
    return settings_page(settings_form(disabled=True), busy=True)


@state("settings", "success", "Saved: inline confirmation at the top with the time.")
def _():
    return settings_page(settings_form(), alert("success", "Settings saved", "Saved at 10:42 AM.", close=True, role="status") + '<div style="height: var(--space-4);"></div>')


# ======================================================================= dialogs
def dash_behind():
    return inert(dash_page(events_table(hover_first=False)))


def queue_behind():
    return inert(queue_page('<ul class="review-list">' + "".join(review_card(q) for q in QUEUE) + '</ul>'))


def settings_behind():
    return inert(settings_page(settings_form()))


DANGER_ICON = f'<div class="dialog__icon dialog__icon--danger" aria-hidden="true">{icon("warning")}</div>'

# ---- cancel event
screen("cancel-event", "dialog", "Cancel event", opens_from="organizer-dashboard")
CANCEL_REASON = "Our venue double-booked Hall B. We’re moving to January and will post the new date here."


def cancel_body(reason="", invalid=False, disabled=False, confirm=False, typed=""):
    dis = " disabled" if disabled else ""
    err = "Tell attendees why, in a sentence or two. It’s shown on the listing and in the email." if invalid else ""
    f = field("Reason for attendees", txt("cancel-reason", reason, 3, invalid=invalid, help=True), "Shown on the listing and emailed to everyone going.", err, fid="cancel-reason")
    n = (f'<label class="choice"><input type="checkbox" checked{dis}><span class="choice__text">Email the 318 people going<small>Sent from 6ixstack on your behalf</small></span></label>')
    c = ""
    if confirm:
        c = field("Type the event name to confirm", inp("confirm-name", typed, help=True, extra=' autocomplete="off"' + (" autofocus" if not typed else "")),
                  "Azure Data & AI Day GTA", fid="confirm-name")
    return f'<fieldset class="stack"{dis}>{f}{n}{c}</fieldset>'


def cancel_footer(busy=False, label="Cancel event", danger_disabled=False):
    b = ' aria-busy="true"' if busy else ""
    d = " disabled" if danger_disabled else ""
    return (f'<a class="btn" href="{P("organizer-dashboard")}" autofocus>Keep event</a>'
            f'<button class="btn btn--danger" type="button"{b}{d}>{"Cancelling…" if busy else label}</button>')


CANCEL_TITLE = "Cancel “Azure Data & AI Day GTA”?"
CANCEL_DESC = "It stays on 6ixstack marked as cancelled, ticket links are removed and feeds update. This can’t be undone."


@state("cancel-event", "default", "Destructive confirm: names the event, asks for a reason shown to attendees; Keep event has focus.")
def _():
    return dash_behind() + dialog(CANCEL_TITLE, cancel_body(), cancel_footer(), CANCEL_DESC, DANGER_ICON)


@state("cancel-event", "busy", "Cancelling: inputs locked, danger button busy, Keep event still available.")
def _():
    return dash_behind() + dialog(CANCEL_TITLE, cancel_body(CANCEL_REASON, disabled=True), cancel_footer(True), CANCEL_DESC, DANGER_ICON)


@state("cancel-event", "invalid", "No reason given: inline error, focus on the reason field.")
def _():
    return dash_behind() + dialog(CANCEL_TITLE, cancel_body(invalid=True), cancel_footer(), CANCEL_DESC, DANGER_ICON)


@state("cancel-event", "failed", "Cancelling failed: the event is still live; the reason is preserved; retry.")
def _():
    body = alert("danger", "The event wasn’t cancelled", "It’s still published and nobody was emailed. Try again.", role="alert") + cancel_body(CANCEL_REASON)
    return dash_behind() + dialog(CANCEL_TITLE, body, cancel_footer(label="Try again"), CANCEL_DESC, DANGER_ICON)


@state("cancel-event", "confirm", "Extra friction for a paid event with 318 attendees: type the name before the danger button enables.")
def _():
    return dash_behind() + dialog(CANCEL_TITLE, cancel_body(CANCEL_REASON, confirm=True, typed="Azure Data & AI"), cancel_footer(danger_disabled=True), CANCEL_DESC, DANGER_ICON) + note(
        "Cancel event stays disabled until the typed name matches exactly (case-insensitive).", "top: 1rem; left: 1rem;")


# ---- reject submission
screen("reject-submission", "dialog", "Reject submission", opens_from="review-queue")
REASONS = [("address", "Missing or unclear venue address"), ("topic", "Not a developer event"), ("dup", "Duplicate of an existing listing"), ("spam", "Spam or advertising"), ("conduct", "Breaks the code of conduct")]


def reject_body(picked=None, msg="", invalid=False, disabled=False):
    iv = ' aria-invalid="true" aria-describedby="reason-error"' if invalid else ""
    rs = "".join(f'<label class="choice"><input type="radio" name="reason" value="{k}"{CHECKED if k == picked else ""}{iv}{" autofocus" if invalid and i == 0 else ""}><span class="choice__text">{t}</span></label>'
                 for i, (k, t) in enumerate(REASONS))
    err = '<span class="field__error" id="reason-error">Choose a reason. The organizer sees it in their email.</span>' if invalid else ""
    m = field("Message to the organizer", txt("reject-msg", msg, 3, help=True), "Say what would make it acceptable, if anything.", fid="reject-msg", optional=True)
    dis = " disabled" if disabled else ""
    return f'<fieldset class="stack"{dis}><fieldset><legend>Reason</legend>{rs}{err}</fieldset>{m}</fieldset>'


def reject_footer(busy=False, label="Reject submission"):
    b = ' aria-busy="true"' if busy else ""
    return f'<a class="btn" href="{P("review-queue")}">Cancel</a><button class="btn btn--danger" type="button"{b}>{"Rejecting…" if busy else label}</button>'


R_TITLE = "Reject “Free crypto trading masterclass”?"
R_DESC = "Submitted by WealthFast Academy (promo@wealthfast.biz). They get an email with your reason."


@state("reject-submission", "default", "Pick a reason and optionally explain; the organizer is emailed.")
def _():
    return queue_behind() + dialog(R_TITLE, reject_body(), reject_footer(), R_DESC, DANGER_ICON)


@state("reject-submission", "busy", "Rejecting: choices locked, button busy.")
def _():
    return queue_behind() + dialog(R_TITLE, reject_body("spam", "This is advertising for a trading course, not a developer event.", disabled=True), reject_footer(True), R_DESC, DANGER_ICON)


@state("reject-submission", "invalid", "No reason chosen: inline error, focus on the first reason.")
def _():
    return queue_behind() + dialog(R_TITLE, reject_body(invalid=True), reject_footer(), R_DESC, DANGER_ICON)


@state("reject-submission", "failed", "Rejecting failed: still in the queue, choices kept, retry.")
def _():
    body = alert("danger", "The submission wasn’t rejected", "It’s still in the queue and nobody was emailed. Try again.", role="alert") + reject_body("spam", "This is advertising for a trading course, not a developer event.")
    return queue_behind() + dialog(R_TITLE, body, reject_footer(label="Try again"), R_DESC, DANGER_ICON)


# ---- sign out
screen("sign-out", "dialog", "Sign out", opens_from="settings", na={"invalid": "No inputs; a single confirmation."})


@state("sign-out", "default", "Confirm sign out on this device; Stay signed in has focus.")
def _():
    foot = f'<a class="btn" href="{P("settings")}" autofocus>Stay signed in</a><a class="btn btn--primary" href="{P("events")}">Sign out</a>'
    return settings_behind() + dialog("Sign out of 6ixstack?", '<p class="text-muted">You’ll need a new email link to sign back in. Other devices stay signed in.</p>', foot, size="dialog__panel--sm")


@state("sign-out", "busy", "Signing out: button busy, nothing else to do.")
def _():
    foot = f'<button class="btn" type="button" disabled>Stay signed in</button><button class="btn btn--primary" type="button" aria-busy="true">Signing out…</button>'
    return settings_behind() + dialog("Sign out of 6ixstack?", '<p class="text-muted">You’ll need a new email link to sign back in. Other devices stay signed in.</p>', foot, size="dialog__panel--sm", close=False, dismiss=False)


# ---- delete account
screen("delete-account", "dialog", "Delete account", opens_from="settings")
DEL_TITLE = "Delete your organizer account?"
DEL_DESC = "You lose access to edit GTA Azure Community events. Published events stay up, managed by your 2 co-organizers. This can’t be undone."


def del_body(typed="", invalid=False, disabled=False):
    err = f"That doesn’t match. Type {ME['email']} exactly." if invalid else ""
    dis = " disabled" if disabled else ""
    f = field(f"Type your email, {ME['email']}, to confirm", inp("del-email", typed, "email", invalid=invalid, extra=' autocomplete="off"' + ("" if typed else " autofocus")), "", err, fid="del-email")
    return f'<fieldset class="stack"{dis}>{f}</fieldset>'


def del_footer(busy=False, label="Delete account", disabled=False):
    b = ' aria-busy="true"' if busy else ""
    d = " disabled" if disabled else ""
    return f'<a class="btn" href="{P("settings")}">Keep account</a><button class="btn btn--danger" type="button"{b}{d}>{"Deleting…" if busy else label}</button>'


@state("delete-account", "default", "Destructive confirm: says exactly what is lost and what stays; email confirmation field.")
def _():
    return settings_behind() + dialog(DEL_TITLE, del_body(), del_footer(), DEL_DESC, DANGER_ICON)


@state("delete-account", "busy", "Deleting: field locked, danger button busy.")
def _():
    return settings_behind() + dialog(DEL_TITLE, del_body(ME["email"], disabled=True), del_footer(True), DEL_DESC, DANGER_ICON, close=False, dismiss=False)


@state("delete-account", "invalid", "Typed email doesn't match: inline error, input kept and focused.")
def _():
    return settings_behind() + dialog(DEL_TITLE, del_body("priya@gtaazure.com", invalid=True), del_footer(), DEL_DESC, DANGER_ICON)


@state("delete-account", "failed", "Deletion failed: nothing was deleted; retry or contact support.")
def _():
    body = alert("danger", "Your account wasn’t deleted", f'Nothing changed. Try again, or <a href="{P("contact")}">contact us</a> and we’ll do it for you.', role="alert") + del_body(ME["email"])
    return settings_behind() + dialog(DEL_TITLE, body, del_footer(label="Try again"), DEL_DESC, DANGER_ICON)


@state("delete-account", "confirm", "Typed email matches: the danger button enables; Keep account stays the safe default.")
def _():
    return settings_behind() + dialog(DEL_TITLE, del_body(ME["email"]), del_footer(), DEL_DESC, DANGER_ICON) + note(
        "Delete account enables only once the email matches; until then it is disabled with the reason read out by its description.", "top: 1rem; left: 1rem;")


# ======================================================================= notifications
screen("submission-banner", "notification", "Submission status banner", opens_from="organizer-dashboard")


def dash_with(b):
    return dash_page(events_table(hover_first=False), banner=f'<div style="margin-bottom: var(--space-6);">{b}</div>')


@state("submission-banner", "info", "Your event is in review; says how long it usually takes.")
def _():
    return dash_with(alert("info", "“Fabric for Power BI developers” is in review", "Moderators usually reply within a day. We’ll email you either way.", close=True))


@state("submission-banner", "success", "Approved and published, with a link to the live listing.")
def _():
    return dash_with(alert("success", "“Fabric for Power BI developers” is live", "It’s in the list, the calendar and 41 matching feeds.",
                           f'<a href="{P("event-detail")}">View the listing</a><a href="{D("share-event")}">Share it</a>', close=True))


@state("submission-banner", "warning", "A moderator needs one change before approving.")
def _():
    return dash_with(alert("warning", "“Azure Bicep clinic” needs a venue address", "Add the street address and room, then resubmit. It keeps its place in the queue.",
                           f'<a href="{P("edit-event", "invalid")}">Add the address</a>'))


@state("submission-banner", "danger", "Rejected with the moderator's reason and a way to ask about it.")
def _():
    return dash_with(alert("danger", "“Azure Bicep clinic” wasn’t approved", "“We couldn’t confirm where this happens. Add the venue address and submit again.” — Jordan, 6ixstack moderator",
                           f'<a href="{P("edit-event")}">Edit and resubmit</a><a href="{P("contact")}">Ask a question</a>', role="alert"))


@state("submission-banner", "persistent", "Email not verified: stays until verified; events can't be published until then.")
def _():
    return dash_with(alert("warning", "Verify priya@gtaazure.ca to publish events", "Your submissions wait in review until you click the link we sent.",
                           '<button type="button">Resend verification email</button>')) + note("No close button: the banner stays until the address is verified.", "top: 12rem; right: 1rem;")


screen("moderation-toast", "notification", "Moderation toast", opens_from="review-queue")


def queue_under(n=3):
    return queue_page('<ul class="review-list">' + "".join(review_card(q) for q in QUEUE[:n]) + '</ul>', sub=f"{n} waiting · oldest submitted yesterday")


@state("moderation-toast", "info", "Another moderator is reviewing the same submission.")
def _():
    return queue_under(4) + toast_region(toast("info", "Sam is also reviewing “Kubernetes on a budget”", "Your actions won’t clash; the first decision wins."))


@state("moderation-toast", "success", "Approved, with Undo for the life of the toast.")
def _():
    return queue_under(3) + toast_region(toast("success", "Approved “Rust in production at scale”", "It’s live and Toronto Rust Meetup has been emailed.", "Undo")) + note(
        "Undo is available for 8 s; the organizer email is held until the toast closes.", "bottom: 10rem; right: 1rem;")


@state("moderation-toast", "warning", "Approved, but a possible duplicate was flagged.")
def _():
    return queue_under(3) + toast_region(toast("warning", "Approved with a possible duplicate", "“Kubernetes on a budget” may duplicate a Nov 19 listing.", "Compare"))


@state("moderation-toast", "danger", "Approval failed: persistent error toast with retry.")
def _():
    return queue_under(4) + toast_region(toast("danger", "Couldn’t approve “Rust in production at scale”", "It’s still in the queue. Try again.", "Try again", role="alert"))


@state("moderation-toast", "with-action", "Rejected, with View to open the sent email.")
def _():
    return queue_under(3) + toast_region(toast("info", "Rejected “Free crypto trading masterclass”", "WealthFast Academy was emailed your reason.", "View email"))


@state("moderation-toast", "stacked", "Three toasts after quick decisions: newest at the bottom.")
def _():
    return queue_under(1) + toast_region(
        toast("success", "Approved “Rust in production at scale”", "", "Undo"),
        toast("success", "Approved “Fabric for Power BI developers”", "", "Undo"),
        toast("info", "Rejected “Free crypto trading masterclass”", "", "View email"))
