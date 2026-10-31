import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface SubmissionCheck {
  kind: string;
  outcome: 'passed' | 'warning' | 'pending';
  message: string;
}

export interface ReviewCardData {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  whenLabel: string;
  whereLabel: string;
  topics: string[];
  submittedLabel: string;
  submitterEmail: string;
  checks: SubmissionCheck[];
}

export interface ReviewQueue {
  summary: string;
  waitingCount: number;
  cards: ReviewCardData[];
}

export interface ModerationApi {
  /** Fails with `ApiError` kind `Forbidden` for a signed-in non-moderator. */
  getQueue(): Observable<ReviewQueue>;
}

export const MODERATION_API = new InjectionToken<ModerationApi>('MODERATION_API');

@Injectable()
export class HttpModerationApi implements ModerationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getQueue(): Observable<ReviewQueue> {
    return this.http.get<ReviewQueue>(`${this.baseUrl}/api/moderation/queue`);
  }
}
