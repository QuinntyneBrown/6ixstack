import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { EventMapData, EVENTS_API } from 'api';
import { EventMap, MapNotice } from 'components';
import { EventFilters } from '../../../shared/filters/event-filters';
import { MapTimelineState, prefersReducedMotion, TimelinePlayer } from './map-timeline-state';

type MapState = { status: 'loading' } | { status: 'ready'; data: EventMapData } | { status: 'failed' };

const EMPTY: EventMapData = { points: [], streams: [], days: [] };

/**
 * The map column of the events page (discovery/event-map): loads the map for the list's filters on its own, so a
 * failure never touches the list, and owns the loading, empty and failed states around `EventMap`.
 */
@Component({
  selector: 'sx-event-map-panel',
  imports: [EventMap],
  template: `
    @defer (on immediate) {
      <sx-event-map
        [points]="data().points"
        [streams]="data().streams"
        [days]="data().days"
        [focusedDay]="state.focusedDay()?.date ?? null"
        [hoveredSlug]="state.hoveredSlug()"
        [playing]="state.playing()"
        [still]="still"
        [busy]="mapState().status === 'loading'"
        [notice]="notice()"
        (dotHovered)="state.hoveredSlug.set($event)"
        (dotActivated)="reveal.emit($event)"
        (dayPicked)="pick($event)"
        (focusCleared)="clear()"
        (playToggled)="togglePlay()"
        (noticeAction)="retry()"
      />
    } @placeholder {
      <div class="map-placeholder" aria-busy="true"></div>
    } @error {
      <div class="map-placeholder" role="status">The map didn't load. The list has every event.</div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .map-placeholder {
      height: 18.75rem;
      border-radius: var(--borderRadius2XLarge);
      background: var(--sx-map-background);
      color: var(--sx-map-foreground);
      padding: var(--spacingHorizontalXL);
    }
    @media (min-width: 64rem) {
      .map-placeholder {
        height: calc(100dvh - 7.5rem);
        min-height: 37.5rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventMapPanel {
  private readonly api = inject(EVENTS_API);
  private readonly player = inject(TimelinePlayer);
  protected readonly state = inject(MapTimelineState);

  readonly filters = input.required<EventFilters>();
  /** A dot or arc was activated: the page scrolls the list to that event (L2-012). */
  readonly reveal = output<string>();
  /** A day was focused by hand (not by playback): the page may scroll the list to it (L2-013). */
  readonly dayChosen = output<string>();

  protected readonly still = prefersReducedMotion();
  private readonly attempt = signal(0);
  protected readonly mapState = signal<MapState>({ status: 'loading' });
  protected readonly data = computed(() => {
    const s = this.mapState();
    return s.status === 'ready' ? s.data : EMPTY;
  });

  protected readonly notice = computed<MapNotice | null>(() => {
    const s = this.mapState();
    if (s.status === 'loading') return { text: 'Plotting events…', icon: 'clock' };
    if (s.status === 'failed') {
      return { text: "The map didn't load. The list has every event.", icon: 'alert', action: 'Try again' };
    }
    if (!s.data.points.length && !s.data.streams.length) {
      return { text: "Nothing on the map yet. New events appear here as soon as they're approved." };
    }
    return null;
  });

  constructor() {
    effect((onCleanup) => {
      const f = this.filters();
      this.attempt();
      untracked(() => {
        // A filter change stops playback and clears the focused day (L2-014).
        this.player.stop();
        this.state.focusedDay.set(null);
        this.mapState.set({ status: 'loading' });
      });
      const sub = this.api.map({ format: f.format, topics: f.topics, q: f.q }).subscribe({
        next: (data) => this.mapState.set({ status: 'ready', data }),
        error: () => this.mapState.set({ status: 'failed' }),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected retry(): void {
    this.attempt.update((n) => n + 1);
  }

  /** Picking the focused day again clears it; picking any day stops playback (L2-013, L2-014). */
  protected pick(date: string): void {
    this.player.stop();
    if (this.state.focusedDay()?.date === date) {
      this.state.focusedDay.set(null);
      return;
    }
    const day = this.data().days.find((d) => d.date === date);
    if (!day) return;
    this.state.focusedDay.set({ date, label: day.label });
    this.dayChosen.emit(date);
  }

  protected clear(): void {
    this.player.stop();
    this.state.focusedDay.set(null);
  }

  protected togglePlay(): void {
    if (this.state.playing()) {
      this.player.stop();
      return;
    }
    this.player.play(
      this.data()
        .days.filter((d) => d.count > 0)
        .map((d) => ({ date: d.date, label: d.label })),
    );
  }
}
