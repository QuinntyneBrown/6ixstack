"""Event map from prototype v2 ("Where it's happening") as a static SVG.

Coordinates, stream origins, shoreline and the projection match the Magic
Patterns canvas implementation, so dots land where the prototype draws them.
"""
import math
from core import EV, esc, icon

GEO = {
    "tdnug-net11": (43.6426, -79.3776), "ngto-signals": (43.6599, -79.3884), "azure-data-ai-day": (43.5907, -79.6436),
    "awsug-bedrock": (43.6416, -79.3865), "gta-ai-hackathon": (43.8519, -79.3378), "reactto-rsc": (43.6513, -79.3964),
    "wai-rag-eval": (43.6595, -79.3905), "azure-to-landing-zones": (43.6455, -79.3836), "brampton-blazor-angular": (43.6858, -79.76),
}
STREAM_FROM = {"reactor-foundry-agents": ("Redmond", "west"), "dotnetconf-aspire": ("London", "east"), "ngconf-roadmap": ("Salt Lake City", "west"),
               "sk-office-hours": ("Redmond", "west"), "react-summit-perf": ("Amsterdam", "east")}
SHORE = [(-80.3, 43.27), (-79.9, 43.29), (-79.78, 43.36), (-79.69, 43.43), (-79.6, 43.5), (-79.53, 43.57), (-79.48, 43.615), (-79.42, 43.63), (-79.37, 43.638),
         (-79.32, 43.655), (-79.25, 43.68), (-79.18, 43.725), (-79.1, 43.78), (-79, 43.825), (-78.86, 43.86), (-78.4, 43.9)]
PLACES = [("Toronto", -79.415, 43.705, "city"), ("Mississauga", -79.655, 43.622, "city"), ("Brampton", -79.76, 43.72, "city"), ("Vaughan", -79.53, 43.83, "city"),
          ("Markham", -79.31, 43.885, "city"), ("Scarborough", -79.23, 43.775, "city"), ("Lake Ontario", -79.4, 43.52, "water")]
HUB = (-79.383, 43.648)   # where streams land: downtown Toronto
W, H = 480, 560
_HP = math.cos(43.7 * math.pi / 180)
_N = max(1, min((W - 112) / ((-79.28 + 79.82) * _HP), (H - 112) / (43.9 - 43.56)))
DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
# The next two weeks from "today" (Mon Nov 2, 2026). Nov 1, 2026 is a Sunday, so weekday index = (d - 1) % 7.
DAYS = [("2026-11-%02d" % d, d, DOW[(d - 1) % 7][0], DOW[(d - 1) % 7]) for d in range(2, 16)]


def proj(lng, lat):
    return (round(W / 2 + (lng + 79.55) * _HP * _N, 1), round(H * 0.42 - (lat - 43.73) * _N, 1))


LABEL_INSET = 14
CITY_CHAR = 6.4  # a 10 px monospace glyph plus 0.04em tracking


def _label_anchor(x, text):
    """Keep a city label inside the canvas: one that would cross an edge is anchored to the inset instead."""
    half = len(text) * CITY_CHAR / 2
    if x + half > W - LABEL_INSET:
        return W - LABEL_INSET, "end"
    if x - half < LABEL_INSET:
        return LABEL_INSET, "start"
    return x, "middle"


def _regions():
    pts = [proj(x, y) for x, y in SHORE]
    line = " L".join(f"{x},{y}" for x, y in pts)
    land = f"M{line} L{pts[-1][0]},-800 L{pts[0][0]},-800 Z"
    lake = f"M{line} L{pts[-1][0]},{H + 800} L{pts[0][0]},{H + 800} Z"
    return land, lake


def _bez(p0, p1, p2, t):
    u = 1 - t
    return (round(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], 1), round(u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1], 1))


# Motion mirrors the prototype's canvas loop: three comets per stream arc every 3 s (1.6 s while hovered)
# and a ripple from every GTA dot every 2.2 s. SMIL timing cannot read CSS custom properties, so the
# stream durations below mirror --duration-map-stream / --duration-map-stream-hover in tokens.css.
STREAM_S, STREAM_HOVER_S, COMETS, TRAIL = 3.0, 1.6, 3, 6


def event_map(events, focus_day=None, hovered=None, playing=False, timeline=True, title=None, sub=None, uid="m", compact=False, overlay="", busy=False):
    off = lambda e: bool(focus_day) and e["date"] != focus_day          # outside the focused day: faded, no motion
    local_all = [e for e in events if e["fmt"] != "streaming" and e["id"] in GEO]
    streams_all = [e for e in events if e["fmt"] == "streaming" and e["id"] in STREAM_FROM]
    local = [e for e in local_all if not off(e)]
    streams = [e for e in streams_all if not off(e)]
    land, lake = _regions()
    hx, hy = proj(*HUB)
    g = [f'<defs><pattern id="{uid}-land" width="8" height="8" patternUnits="userSpaceOnUse"><rect x="3.25" y="3.25" width="1.5" height="1.5" class="event-map__land-dot"/></pattern>'
         f'<pattern id="{uid}-lake" width="16" height="16" patternUnits="userSpaceOnUse"><rect x="3.5" y="3.5" width="1" height="1" class="event-map__lake-dot"/></pattern></defs>'
         f'<path d="{land}" fill="url(#{uid}-land)"/><path d="{lake}" fill="url(#{uid}-lake)"/>']
    for label, lng, lat, kind in PLACES:
        x, y = proj(lng, lat)
        cls = "water" if kind == "water" else "city"
        text = label if kind == "water" else label.upper()
        x, anchor = _label_anchor(x, text) if kind == "city" else (x, "middle")
        g.append(f'<text x="{x}" y="{y}" class="event-map__{cls}" text-anchor="{anchor}">{text}</text>')
    tip = None
    per_side = {"west": 0, "east": 0}
    for idx, e in enumerate(streams_all):
        city, side = STREAM_FROM[e["id"]]
        i = per_side[side]
        per_side[side] += 1
        sx = 0 if side == "west" else W
        sy = round(H * 0.7 + i * 34, 1)
        cx, cy = round((sx + hx) / 2, 1), round(min(sy, hy) - 80, 1)
        t = e["topics"][0]
        is_off, is_hot = off(e), e["id"] == hovered and not off(e)
        state = " is-hot" if is_hot else (" is-dim" if (hovered and not is_hot) or is_off else "")
        d = f"M{sx},{sy} Q{cx},{cy} {hx},{hy}"
        g.append(f'<g class="event-map__stream{state}"><path d="{d}" class="event-map__arc topic-stroke--{t}"/>')
        if not is_off:
            dur = STREAM_HOVER_S if is_hot else STREAM_S
            for zi in range(COMETS):
                phase = (zi / COMETS + idx * 0.17) % 1
                trail = ""
                for j in range(TRAIL):
                    r = round((2.4 if is_hot else 1.7) * (1 - j * 0.12), 2)
                    begin = round(-(phase * dur) + j * 0.012 * dur, 3)
                    trail += (f'<circle r="{r}" class="event-map__comet topic-fill--{t}" style="opacity: {round(1 - j / TRAIL, 2)};">'
                              f'<animateMotion dur="{dur}s" begin="{begin}s" repeatCount="indefinite" path="{d}"/></circle>')
                px, py = _bez((sx, sy), (cx, cy), (hx, hy), (zi + 1) / (COMETS + 1))
                g.append(trail + f'<circle cx="{px}" cy="{py}" r="1.7" class="event-map__comet-still topic-fill--{t}"/>')
        src = e.get("source", "")
        lx = 14 if side == "west" else W - 14
        g.append(f'<text x="{lx}" y="{sy - 8}" class="event-map__origin" text-anchor="{"start" if side == "west" else "end"}">{city} · {src}</text></g>')
        if is_hot:
            tip = (*_bez((sx, sy), (cx, cy), (hx, hy), 0.5), e)
    if streams_all:
        g.append(f'<circle cx="{hx}" cy="{hy}" r="3" class="event-map__hub"/>')
    placed = []
    order = sorted(local_all, key=lambda e: not off(e))           # faded dots first, live ones on top
    for n, e in enumerate(order):
        x0, y0 = proj(GEO[e["id"]][1], GEO[e["id"]][0])
        x, y = x0, y0
        for k in range(1, 12):                                     # nudge overlapping dots apart, as the prototype does
            if not any(((px - x) ** 2 + (py - y) ** 2) ** 0.5 < 11 for px, py in placed):
                break
            a = k * 1.9
            x, y = round(x0 + __import__("math").cos(a) * 11, 1), round(y0 + __import__("math").sin(a) * 11, 1)
        placed.append((x, y))
        t = e["topics"][0]
        is_off, is_hot = off(e), e["id"] == hovered and not off(e)
        state = " is-hot" if is_hot else (" is-off" if is_off else (" is-dim" if hovered else ""))
        parts = ""
        if not is_off and (not hovered or is_hot):
            parts += f'<circle cx="{x}" cy="{y}" r="4" class="event-map__ripple topic-stroke--{t}" style="--i: {round((n * 0.23) % 1, 2)};"/>'
        if e["fmt"] == "hybrid":
            parts += f'<circle cx="{x}" cy="{y}" r="{12 if is_hot else 9}" class="event-map__ring topic-stroke--{t}"/>'
        parts += f'<circle cx="{x}" cy="{y}" r="{6 if is_hot else 4}" class="event-map__dot topic-fill--{t}"/>'
        g.append(f'<g class="event-map__event{state}">{parts}</g>')
        if is_hot:
            tip = (x, y, e)
    if tip:
        x, y, e = tip
        title_txt = e["title"] if len(e["title"]) <= 38 else e["title"][:37] + "…"
        w = 240
        bx = round(max(8, min(x - w / 2, W - w - 8)), 1)
        by = round(y - 58 if y - 58 >= 8 else y + 16, 1)
        g.append(f'<g class="event-map__tip"><rect x="{bx}" y="{by}" width="{w}" height="42" rx="8"/>'
                 f'<text x="{bx + 11}" y="{by + 18}" class="event-map__tip-title">{esc(title_txt)}</text>'
                 f'<text x="{bx + 11}" y="{by + 33}" class="event-map__tip-meta">{e["dow"][:3]} {e["md"].replace("November", "Nov")} · {e["start"]}</text></g>')
    aria = f"Map of {len(local)} events across the GTA and {len(streams)} streams arriving from around the world"
    if title is None:
        title = next((f"{name}, November {d}" for date, d, _, name in DAYS if date == focus_day), "Where it’s happening")
    if sub is None:
        sub = f"{len(local)} across the GTA · {len(streams)} streaming in"
    svg = f'<svg class="event-map__svg" role="img" aria-label="{aria}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">{"".join(g)}</svg>'
    head = (f'<div class="event-map__head"><p class="event-map__title" aria-live="polite">{title}</p><p class="event-map__sub">{sub}</p>'
            '<ul class="event-map__legend"><li><span class="event-map__key event-map__key--dot" aria-hidden="true"></span>In person</li>'
            '<li><span class="event-map__key event-map__key--ring" aria-hidden="true"></span>Hybrid</li>'
            '<li><span class="event-map__key event-map__key--line" aria-hidden="true"></span>Streaming in</li></ul></div>')
    tl = scrubber(events, focus_day, playing) if timeline else ""
    b = ' aria-busy="true"' if busy else ""
    return f'<section class="event-map{" event-map--compact" if compact else ""}" aria-label="Event map"{b}><div class="event-map__canvas">{svg}{head}{overlay}</div>{tl}</section>'


def scrubber(events, focus_day=None, playing=False, disabled=False):
    by = {}
    for e in events:
        by.setdefault(e["date"], []).append(e)
    label = (icon("pause", "icon icon--sm") + "Pause") if playing else (icon("play", "icon icon--sm") + "Play the next two weeks")
    dis_all = " disabled" if disabled or not events else ""
    play = f'<button class="event-map__play" type="button" aria-pressed="{"true" if playing else "false"}"{dis_all}>{label}</button>'
    clear = '<button class="event-map__clear" type="button">Show all dates</button>' if focus_day else ""
    days = ""
    for date, d, letter, name in DAYS:
        evs = by.get(date, [])
        n = len(evs)
        dots = "".join(f'<span class="map-day__dot {"topic-ring" if e["fmt"] == "streaming" else "topic-fill"}--{e["topics"][0]}"></span>' for e in evs[:4])
        dis = " disabled" if not n else ""
        days += (f'<button class="map-day" type="button" aria-pressed="{"true" if date == focus_day else "false"}"{dis} aria-label="{name}, November {d}: {n} event{"" if n == 1 else "s"}">'
                 f'<span class="map-day__dow" aria-hidden="true">{letter}</span><span class="map-day__num" aria-hidden="true">{d}</span><span class="map-day__dots" aria-hidden="true">{dots}</span></button>')
    return (f'<div class="event-map__timeline"><div class="event-map__controls">{play}{clear}</div>'
            f'<div class="event-map__days" role="group" aria-label="Choose a day">{days}</div></div>')


def venue_map(event_id, label):
    """Compact single-venue map for detail pages: same visual language, no timeline."""
    e = EV[event_id]
    return event_map([e], hovered=event_id, timeline=False, title=label, sub="", uid="v-" + event_id, compact=True)
