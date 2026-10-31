import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export type DashboardStatus =
  'published' | 'inReview' | 'draft' | 'needsChanges' | 'past' | 'cancelled' | 'notApproved';

export interface OrganizerEventRow {
  id: string;
  slug: string;
  title: string;
  startsAtUtc: string;
  dateLabel: string;
  status: DashboardStatus;
  statusLabel: string;
  going: number | null;
  needsChangesReason: string | null;
  publicUrl: string | null;
}

export interface SubmissionBanner {
  kind: 'inReview' | 'live' | 'needsChanges' | 'notApproved' | 'unverified';
  key: string;
  title: string;
  text: string;
  eventSlug: string | null;
  dismissible: boolean;
}

export interface OrganizerDashboard {
  communityName: string | null;
  email: string;
  stats: { upcoming: number; inReview: number; going: number; feedSubscribers: number };
  rows: OrganizerEventRow[];
  banner: SubmissionBanner | null;
}

export interface OrganizerEventsApi {
  dashboard(): Observable<OrganizerDashboard>;
  /** Sends a new verification link to the signed-in organizer. */
  resendVerification(): Observable<void>;
}

export const ORGANIZER_EVENTS_API = new InjectionToken<OrganizerEventsApi>('ORGANIZER_EVENTS_API');

@Injectable()
export class HttpOrganizerEventsApi implements OrganizerEventsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  dashboard(): Observable<OrganizerDashboard> {
    return this.http.get<OrganizerDashboard>(`${this.baseUrl}/api/organizer/events`);
  }

  resendVerification(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/organizer/verification-email`, null);
  }
}
