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
  isPaid: boolean;
  goingCount: number;
  /** People going whose email 6ixstack holds; the cancel dialog offers email only above 0. */
  emailableAttendees: number;
}

export interface SubmissionBanner {
  kind: 'inReview' | 'live' | 'needsChanges' | 'notApproved' | 'unverified';
  key: string;
  eventId: string | null;
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

/** The edit form's values; the same shape is sent back to save (L2-054). */
export interface EventDetailsForm {
  title: string;
  organizerName: string;
  description: string;
  topics: string[];
  date: string;
  timeZoneId: string;
  startTime: string;
  endTime: string;
  format: 'inPerson' | 'streaming' | 'hybrid';
  venueName: string | null;
  city: string | null;
  streetAddress: string | null;
  streamUrl: string | null;
  isFree: boolean;
  priceCad: number | null;
  ticketUrl: string | null;
}

export interface EventEdit {
  id: string;
  slug: string;
  title: string;
  status: DashboardStatus;
  statusLine: string;
  isReadOnly: boolean;
  readOnlyLead: string | null;
  goingCount: number;
  details: EventDetailsForm;
  isPaid: boolean;
  emailableAttendees: number;
  cancellationReason: string | null;
  cancelledOnLabel: string | null;
}

export interface CancelEventRequest {
  reason: string;
  notifyAttendees: boolean;
  confirmationName: string | null;
}

export interface EventCancelled {
  title: string;
  status: 'cancelled';
  cancelledAtUtc: string;
  emailsQueued: number;
}

export interface EventSaved {
  slug: string;
  title: string;
  status: DashboardStatus;
  goingCount: number;
  resubmitted: boolean;
}

export interface OrganizerEventsApi {
  dashboard(): Observable<OrganizerDashboard>;
  /** An event for the edit page; 403 carries communityName, eventTitle, signedInEmail and signedInCommunity. */
  getEvent(id: string): Observable<EventEdit>;
  updateEvent(id: string, details: EventDetailsForm): Observable<EventSaved>;
  /** Cancels an event (L2-056); 400 carries field errors for `reason` and `confirmationName`. */
  cancelEvent(id: string, request: CancelEventRequest): Observable<EventCancelled>;
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

  getEvent(id: string): Observable<EventEdit> {
    return this.http.get<EventEdit>(`${this.baseUrl}/api/organizer/events/${encodeURIComponent(id)}`);
  }

  updateEvent(id: string, details: EventDetailsForm): Observable<EventSaved> {
    return this.http.put<EventSaved>(
      `${this.baseUrl}/api/organizer/events/${encodeURIComponent(id)}`,
      details,
    );
  }

  cancelEvent(id: string, request: CancelEventRequest): Observable<EventCancelled> {
    return this.http.post<EventCancelled>(
      `${this.baseUrl}/api/organizer/events/${encodeURIComponent(id)}/cancel`,
      request,
    );
  }

  resendVerification(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/organizer/verification-email`, null);
  }
}
