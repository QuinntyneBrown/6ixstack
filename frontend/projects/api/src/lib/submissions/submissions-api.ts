import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface ReferenceData {
  topics: { key: string; label: string }[];
  cities: string[];
  timeZones: { id: string; label: string }[];
}

/** A submission; property names match the submit form's controls and the API's field errors. */
export interface EventSubmission {
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
  contactEmail: string;
}

export interface SubmissionReceived {
  eventTitle: string;
  contactEmail: string;
}

export interface ReferenceDataApi {
  get(): Observable<ReferenceData>;
}

export interface SubmissionsApi {
  /** Fails with `ApiError` kind `Validation` whose `fieldErrors` are keyed by control name. */
  submit(submission: EventSubmission): Observable<SubmissionReceived>;
}

export const REFERENCE_DATA_API = new InjectionToken<ReferenceDataApi>('REFERENCE_DATA_API');
export const SUBMISSIONS_API = new InjectionToken<SubmissionsApi>('SUBMISSIONS_API');

@Injectable()
export class HttpReferenceDataApi implements ReferenceDataApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(): Observable<ReferenceData> {
    return this.http.get<ReferenceData>(`${this.baseUrl}/api/reference-data`);
  }
}

@Injectable()
export class HttpSubmissionsApi implements SubmissionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  submit(submission: EventSubmission): Observable<SubmissionReceived> {
    return this.http.post<SubmissionReceived>(`${this.baseUrl}/api/submissions`, submission);
  }
}
