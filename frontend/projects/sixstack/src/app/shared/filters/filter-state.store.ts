import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EventFormatFilter } from 'api';
import { isTopic, TOPICS, ToastService } from 'components';
import { EventFilters, MAX_SEARCH_LENGTH, NO_FILTERS } from './event-filters';

const STORAGE_KEY = 'sx-events-filters';
const FORMATS: EventFormatFilter[] = ['all', 'gta', 'streaming'];

/**
 * Mirrors the events filters into the URL (`format`, `topics`, `q`) and remembers the topic and format in
 * localStorage (L2-005). Unknown URL values are ignored. When storage is blocked, the first change raises a
 * warning toast once and filtering keeps working.
 */
@Injectable()
export class FilterStateStore {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastService);
  private warned = false;

  /** Filters from the URL when it has any, otherwise the remembered topic and format. */
  initial(): EventFilters {
    const params = this.route.snapshot.queryParamMap;
    if (['format', 'topics', 'q'].some((key) => params.has(key))) {
      return this.fromParams(params);
    }
    return this.remembered() ?? NO_FILTERS;
  }

  save(filters: EventFilters): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      // Merge, so a page's own parameters (the calendar's month) stay in the URL.
      queryParamsHandling: 'merge',
      queryParams: {
        format: filters.format === 'all' ? null : filters.format,
        topics: filters.topics.length ? filters.topics.join(',') : null,
        q: filters.q || null,
      },
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ format: filters.format, topics: filters.topics }));
    } catch {
      if (!this.warned) {
        this.warned = true;
        this.toasts.show({
          kind: 'warning',
          title: "We can't remember your filters",
          text: 'This browser blocks site storage, so your topics reset when you close the tab.',
        });
      }
    }
  }

  private fromParams(params: ParamMap): EventFilters {
    const format = params.get('format');
    const topics = (params.get('topics') ?? '').split(',');
    return {
      format: FORMATS.includes(format as EventFormatFilter) ? (format as EventFormatFilter) : 'all',
      topics: TOPICS.filter((t) => topics.includes(t)),
      q: (params.get('q') ?? '').slice(0, MAX_SEARCH_LENGTH),
    };
  }

  private remembered(): EventFilters | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as { format?: string; topics?: string[] };
      return {
        format: FORMATS.includes(stored.format as EventFormatFilter)
          ? (stored.format as EventFormatFilter)
          : 'all',
        topics: TOPICS.filter((t) => (stored.topics ?? []).filter(isTopic).includes(t)),
        q: '',
      };
    } catch {
      return null;
    }
  }
}
