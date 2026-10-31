import { DestroyRef, inject, Injectable, signal } from '@angular/core';

export interface FocusedDay {
  date: string;
  label: string;
}

/**
 * What the list and the map share (discovery/event-map): the focused day, whether the timeline is playing, and the
 * row or dot under the pointer. Provided by the events page.
 */
@Injectable()
export class MapTimelineState {
  readonly focusedDay = signal<FocusedDay | null>(null);
  readonly playing = signal(false);
  readonly hoveredSlug = signal<string | null>(null);
}

/** Every 1.1 s (--sx-duration-map-step). */
export const MAP_STEP_MS = 1100;

/**
 * "Play the next two weeks" (L2-014): steps the focus through the days with events every 1.1 s, starting from the
 * first, and stops on the last. Pause, a picked day, a filter change or leaving the page stops it.
 */
@Injectable()
export class TimelinePlayer {
  private readonly state = inject(MapTimelineState);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private days: FocusedDay[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  play(days: FocusedDay[]): void {
    this.stop();
    this.days = days;
    if (!days.length) return;
    this.state.playing.set(true);
    this.show(0);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.state.playing.set(false);
  }

  private show(index: number): void {
    this.state.focusedDay.set(this.days[index]);
    if (index === this.days.length - 1) {
      this.timer = setTimeout(() => this.stop(), MAP_STEP_MS);
      return;
    }
    this.timer = setTimeout(() => this.show(index + 1), MAP_STEP_MS);
  }
}

/** Whether the visitor asked the operating system for reduced motion (L2-012, L2-094). */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
