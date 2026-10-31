import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { bezier, HUB, MAP_HEIGHT, MAP_WIDTH, PLACES, project, regions } from './gta-projection';

export interface MapPoint {
  slug: string;
  title: string;
  date: string;
  firstTopic: string;
  cardMeta: string;
  latitude: number;
  longitude: number;
  isHybrid: boolean;
}

export interface MapStream {
  slug: string;
  title: string;
  date: string;
  firstTopic: string;
  cardMeta: string;
  originCity: string;
  originSide: 'west' | 'east' | string;
  sourceTime: string | null;
}

/** A message over the map, such as "Plotting events…" or a failure with Try again. */
export interface MapNotice {
  text: string;
  icon?: 'info' | 'alert' | 'clock';
  action?: string;
}

export interface MapDay {
  date: string;
  weekdayLetter: string;
  dayOfMonth: number;
  label: string;
  count: number;
  dots: { topic: string; isStream: boolean }[];
}

interface PlacedDot extends MapPoint {
  x: number;
  y: number;
  state: '' | 'is-hot' | 'is-dim' | 'is-off';
  ripple: number;
}

interface PlacedStream extends MapStream {
  path: string;
  sy: number;
  labelX: number;
  state: '' | 'is-hot' | 'is-dim';
  off: boolean;
  stills: [number, number][];
  comets: { r: number; begin: number; opacity: number }[];
  duration: number;
}

const STREAM_S = 3;
const STREAM_HOVER_S = 1.6;
const COMETS = 3;
const TRAIL = 6;

/**
 * "Where it's happening" (design system: event map, L2-011): the GTA basemap with venue dots coloured by first topic,
 * dashed rings for hybrid events, arcs for streams, the hover card, and the day timeline with Play. Everything in the
 * SVG is decorative (`role="img"` with a summary); the list stays the accessible route to every event.
 */
@Component({
  selector: 'sx-event-map',
  imports: [Icon],
  templateUrl: './event-map.html',
  styleUrl: './event-map.scss',
  host: { '[class.event-map--compact]': 'compact()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventMap {
  readonly points = input<MapPoint[]>([]);
  readonly streams = input<MapStream[]>([]);
  readonly days = input<MapDay[]>([]);
  readonly focusedDay = input<string | null>(null);
  readonly hoveredSlug = input<string | null>(null);
  readonly playing = input(false);
  /** Draws a still frame: no comets or ripples (reduced motion). */
  readonly still = input(false);
  readonly compact = input(false, { transform: booleanAttribute });
  readonly showTimeline = input(true);
  readonly busy = input(false);
  /** Overrides the title, e.g. the venue name on a detail page. */
  readonly heading = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly uid = input('m');
  readonly notice = input<MapNotice | null>(null);
  readonly noticeAction = output<void>();

  readonly dotActivated = output<string>();
  readonly dotHovered = output<string | null>();
  readonly dayPicked = output<string>();
  readonly playToggled = output<void>();
  readonly focusCleared = output<void>();

  protected readonly width = MAP_WIDTH;
  protected readonly height = MAP_HEIGHT;
  protected readonly places = PLACES;
  protected readonly regions = regions();
  protected readonly hub = HUB;

  private readonly off = (date: string) => !!this.focusedDay() && date !== this.focusedDay();

  protected readonly dots = computed<PlacedDot[]>(() => {
    const hovered = this.hoveredSlug();
    const placed: [number, number][] = [];
    // Faded dots first so live ones draw on top; overlapping dots are nudged 11 px apart.
    const order = [...this.points()].sort((a, b) => Number(!this.off(a.date)) - Number(!this.off(b.date)));
    return order.map((p, n) => {
      const [x0, y0] = project(p.longitude, p.latitude);
      let [x, y] = [x0, y0];
      for (let k = 1; k < 12 && placed.some(([px, py]) => Math.hypot(px - x, py - y) < 11); k++) {
        const a = k * 1.9;
        x = Math.round((x0 + Math.cos(a) * 11) * 10) / 10;
        y = Math.round((y0 + Math.sin(a) * 11) * 10) / 10;
      }
      placed.push([x, y]);
      const off = this.off(p.date);
      const hot = p.slug === hovered && !off;
      const state = hot ? 'is-hot' : off ? 'is-off' : hovered ? 'is-dim' : '';
      return { ...p, x, y, state, ripple: Math.round(((n * 0.23) % 1) * 100) / 100 };
    });
  });

  protected readonly arcs = computed<PlacedStream[]>(() => {
    const hovered = this.hoveredSlug();
    const perSide: Record<string, number> = { west: 0, east: 0 };
    return this.streams().map((s, idx) => {
      const side = s.originSide === 'west' ? 'west' : 'east';
      const i = perSide[side]++;
      const sx = side === 'west' ? 0 : MAP_WIDTH;
      const sy = Math.round((MAP_HEIGHT * 0.7 + i * 34) * 10) / 10;
      const c: [number, number] = [
        Math.round(((sx + HUB[0]) / 2) * 10) / 10,
        Math.round((Math.min(sy, HUB[1]) - 80) * 10) / 10,
      ];
      const off = this.off(s.date);
      const hot = s.slug === hovered && !off;
      const duration = hot ? STREAM_HOVER_S : STREAM_S;
      const comets: PlacedStream['comets'] = [];
      for (let z = 0; z < COMETS; z++) {
        const phase = (z / COMETS + idx * 0.17) % 1;
        for (let j = 0; j < TRAIL; j++) {
          comets.push({
            r: Math.round((hot ? 2.4 : 1.7) * (1 - j * 0.12) * 100) / 100,
            begin: Math.round((-(phase * duration) + j * 0.012 * duration) * 1000) / 1000,
            opacity: Math.round((1 - j / TRAIL) * 100) / 100,
          });
        }
      }
      return {
        ...s,
        path: `M${sx},${sy} Q${c[0]},${c[1]} ${HUB[0]},${HUB[1]}`,
        sy,
        labelX: side === 'west' ? 14 : MAP_WIDTH - 14,
        state: hot ? 'is-hot' : (hovered && !hot) || off ? 'is-dim' : '',
        off,
        stills: [1, 2, 3].map((k) => bezier([sx, sy], c, HUB, k / (COMETS + 1))),
        comets,
        duration,
      };
    });
  });

  /** The hover card for the hovered dot or arc. */
  protected readonly tip = computed(() => {
    const dot = this.dots().find((d) => d.state === 'is-hot');
    const arc = this.arcs().find((a) => a.state === 'is-hot');
    const at = dot
      ? { x: dot.x, y: dot.y, e: dot as MapPoint | MapStream }
      : arc
        ? (() => {
            const [x, y] = this.arcMid(arc);
            return { x, y, e: arc as MapPoint | MapStream };
          })()
        : null;
    if (!at) return null;
    const w = 240;
    const title = at.e.title.length <= 38 ? at.e.title : at.e.title.slice(0, 37) + '…';
    const bx = Math.round(Math.max(8, Math.min(at.x - w / 2, MAP_WIDTH - w - 8)) * 10) / 10;
    const by = Math.round((at.y - 58 >= 8 ? at.y - 58 : at.y + 16) * 10) / 10;
    return { x: bx, y: by, width: w, title, meta: at.e.cardMeta };
  });

  protected readonly liveCounts = computed(() => ({
    gta: this.points().filter((p) => !this.off(p.date)).length,
    streams: this.streams().filter((s) => !this.off(s.date)).length,
  }));

  protected readonly title = computed(() => {
    if (this.heading()) return this.heading()!;
    const day = this.days().find((d) => d.date === this.focusedDay());
    return day ? day.label : 'Where it’s happening';
  });

  protected readonly sub = computed(() => {
    if (this.subtitle() !== null) return this.subtitle()!;
    const c = this.liveCounts();
    return `${c.gta} across the GTA · ${c.streams} streaming in`;
  });

  protected readonly summary = computed(() => {
    const c = this.liveCounts();
    return `Map of ${c.gta} events across the GTA and ${c.streams} streams arriving from around the world`;
  });

  protected readonly anyEvents = computed(() => this.days().some((d) => d.count > 0));

  protected dayLabel(day: MapDay): string {
    return `${day.label}: ${day.count} event${day.count === 1 ? '' : 's'}`;
  }

  private arcMid(arc: PlacedStream): [number, number] {
    const [, rest] = arc.path.split('Q');
    const [c, h] = rest.trim().split(' ');
    const [cx, cy] = c.split(',').map(Number);
    const [hx, hy] = h.split(',').map(Number);
    return bezier([arc.labelX === 14 ? 0 : MAP_WIDTH, arc.sy], [cx, cy], [hx, hy], 0.5);
  }
}
