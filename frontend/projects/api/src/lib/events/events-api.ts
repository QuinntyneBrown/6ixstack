import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { EventDetail } from './event-detail';
import { ListingCache } from './listing-cache';

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

export interface MonthCalendar {
  /** `YYYY-MM`. */
  month: string;
  monthLabel: string;
  totals: { events: number; gta: number; streaming: number };
  counts: { all: number; gta: number; streaming: number };
  matchCount: number;
  days: {
    date: string;
    events: { slug: string; title: string; firstTopic: string | null; startTimeEt: string }[];
  }[];
}

export interface MonthCalendarQuery {
  month: string;
  format?: EventFormatFilter;
  topics?: string[];
}

/** The "Where it's happening" map for the list's filters (discovery/event-map). */
export interface EventMapData {
  points: {
    slug: string;
    title: string;
    date: string;
    topics: string[];
    firstTopic: string;
    cardMeta: string;
    latitude: number;
    longitude: number;
    isHybrid: boolean;
  }[];
  streams: {
    slug: string;
    title: string;
    date: string;
    topics: string[];
    firstTopic: string;
    cardMeta: string;
    originCity: string;
    originSide: 'west' | 'east';
    sourceTime: string | null;
  }[];
  days: {
    date: string;
    weekdayLetter: string;
    dayOfMonth: number;
    label: string;
    count: number;
    dots: { topic: string; isStream: boolean }[];
  }[];
}

/** This week's featured event, as the card shows it (L2-006). */
export interface FeaturedEvent {
  slug: string;
  title: string;
  organizer: string;
  description: string;
  monthLabel: string;
  dayOfMonth: string;
  locationLabel: string;
  hasLivestream: boolean;
  whenLabel: string;
  primaryAction: { label: string; url: string };
}

export type ReportReason = 'wrongDetails' | 'cancelled' | 'brokenLink' | 'spam' | 'codeOfConduct';

export interface ProblemReport {
  reason: ReportReason;
  details: string | null;
  replyEmail: string | null;
}

/**
 * The events API. `featured`, `map`, `month` and page 1 of `upcoming` are listings saved for the visit (L2-130):
 * when one is saved, the observable emits it at once, then emits again only if a quiet refresh brings a change,
 * and a failed refresh completes without an error.
 */
export interface EventsApi {
  /** Sends a problem report (L2-039); 400 carries field errors, 429 means too many from this address. */
  report(slug: string, report: ProblemReport): Observable<void>;
  /** This week's featured event, or null when nothing is featured (204). */
  featured(): Observable<FeaturedEvent | null>;
  /** The map's dots, arcs and timeline days for the same filters as the list. */
  map(query: UpcomingEventsQuery): Observable<EventMapData>;
  /** Upcoming published events: page 1 is the two-week window, later pages hold 20 more each. */
  upcoming(query: UpcomingEventsQuery): Observable<UpcomingEvents>;
  /** One published event; fails with `ApiError` kind `NotFound` for an unknown or unpublished slug. */
  detail(slug: string): Observable<EventDetail>;
  /** The event as a single-event .ics file. */
  downloadIcs(slug: string): Observable<CalendarFile>;
  /** One Toronto month for the calendar grid. */
  month(query: MonthCalendarQuery): Observable<MonthCalendar>;
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
  /** Listings saved for the visit; a saved one shows at once and refreshes quietly (L2-130). */
  private readonly listings = new ListingCache();

  /** GET `path` through the saved listings; a quiet refresh revalidates past the browser's HTTP cache. */
  private listing<T>(path: string, params: HttpParams): Observable<T> {
    return this.listings.cached(`${path}?${params.toString()}`, (refresh) =>
      this.http.get<T>(`${this.baseUrl}${path}`, { params, ...(refresh ? { cache: 'no-cache' } : {}) }),
    );
  }

  upcoming(query: UpcomingEventsQuery): Observable<UpcomingEvents> {
    let params = new HttpParams();
    if (query.format && query.format !== 'all') params = params.set('format', query.format);
    for (const topic of query.topics ?? []) params = params.append('topics', topic);
    if (query.q) params = params.set('q', query.q);
    if (query.page && query.page > 1) {
      // Later pages are appended to the list, so they must answer once: they are never saved.
      params = params.set('page', query.page);
      return this.http.get<UpcomingEvents>(`${this.baseUrl}/api/events`, { params });
    }
    return this.listing<UpcomingEvents>('/api/events', params);
  }

  report(slug: string, report: ProblemReport): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/events/${encodeURIComponent(slug)}/reports`, report);
  }

  featured(): Observable<FeaturedEvent | null> {
    return this.listings.cached('/api/events/featured', (refresh) =>
      this.http
        .get<FeaturedEvent>(`${this.baseUrl}/api/events/featured`, {
          observe: 'response',
          ...(refresh ? { cache: 'no-cache' } : {}),
        })
        .pipe(map((response) => (response.status === 204 ? null : response.body))),
    );
  }

  map(query: UpcomingEventsQuery): Observable<EventMapData> {
    let params = new HttpParams();
    if (query.format && query.format !== 'all') params = params.set('format', query.format);
    for (const topic of query.topics ?? []) params = params.append('topics', topic);
    if (query.q) params = params.set('q', query.q);
    return this.listing<EventMapData>('/api/events/map', params);
  }

  month(query: MonthCalendarQuery): Observable<MonthCalendar> {
    let params = new HttpParams().set('month', query.month);
    if (query.format && query.format !== 'all') params = params.set('format', query.format);
    for (const topic of query.topics ?? []) params = params.append('topics', topic);
    return this.listing<MonthCalendar>('/api/events/calendar', params);
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
