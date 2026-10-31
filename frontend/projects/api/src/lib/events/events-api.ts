import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { EventDetail } from './event-detail';

export type EventFormatFilter = 'all' | 'gta' | 'streaming';

export interface UpcomingEventsQuery {
  format?: EventFormatFilter;
  topics?: string[];
  q?: string;
  page?: number;
}

export interface EventSummary {
  slug: string;
  title: string;
  organizer: string;
  format: 'inPerson' | 'streaming' | 'hybrid';
  topics: string[];
  startTimeEt: string;
  sourceTime: string | null;
  locationLabel: string;
  priceLabel: string;
  goingCount: number;
  isSoldOut: boolean;
  isCancelled: boolean;
}

export interface DayGroup {
  date: string;
  weekday: string;
  dateLabel: string;
  events: EventSummary[];
}

export interface UpcomingEvents {
  heroCounts: { gta: number; streamable: number };
  formatCounts: { all: number; gta: number; streaming: number };
  days: DayGroup[];
  shown: number;
  total: number;
  throughLabel: string | null;
  hasMore: boolean;
  search: string;
}

export interface EventsApi {
  /** Upcoming published events: page 1 is the two-week window, later pages hold 20 more each. */
  upcoming(query: UpcomingEventsQuery): Observable<UpcomingEvents>;
  /** One published event; fails with `ApiError` kind `NotFound` for an unknown or unpublished slug. */
  detail(slug: string): Observable<EventDetail>;
  /** The event as a single-event .ics file. */
  downloadIcs(slug: string): Observable<CalendarFile>;
}

export interface CalendarFile {
  blob: Blob;
  fileName: string;
}

export const EVENTS_API = new InjectionToken<EventsApi>('EVENTS_API');

@Injectable()
export class HttpEventsApi implements EventsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  upcoming(query: UpcomingEventsQuery): Observable<UpcomingEvents> {
    let params = new HttpParams();
    if (query.format && query.format !== 'all') params = params.set('format', query.format);
    for (const topic of query.topics ?? []) params = params.append('topics', topic);
    if (query.q) params = params.set('q', query.q);
    if (query.page && query.page > 1) params = params.set('page', query.page);
    return this.http.get<UpcomingEvents>(`${this.baseUrl}/api/events`, { params });
  }

  downloadIcs(slug: string): Observable<CalendarFile> {
    return this.http
      .get(`${this.baseUrl}/api/events/${encodeURIComponent(slug)}/ics`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          blob: response.body!,
          fileName:
            /filename="?([^";]+)"?/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ??
            `${slug}.ics`,
        })),
      );
  }

  detail(slug: string): Observable<EventDetail> {
    return this.http.get<EventDetail>(`${this.baseUrl}/api/events/${encodeURIComponent(slug)}`);
  }
}
