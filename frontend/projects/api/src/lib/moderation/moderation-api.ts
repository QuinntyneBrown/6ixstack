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

export interface ApprovalResult {
  eventId: string;
  title: string;
  organizerName: string;
  decisionId: string;
  undoDeadlineUtc: string;
  isPublished: boolean;
  possibleDuplicate: { eventId: string; slug: string; dateLabel: string } | null;
}

export type RejectionReason =
  'missingVenueAddress' | 'notDeveloperEvent' | 'duplicate' | 'spamOrAdvertising' | 'codeOfConduct';

export interface RejectionResult {
  eventId: string;
  title: string;
  organizerName: string;
  status: 'rejected' | 'needsChanges';
  emailPreview: { to: string; subject: string; body: string };
}

export interface ModerationApi {
  /** Fails with `ApiError` kind `Forbidden` for a signed-in non-moderator. */
  getQueue(): Observable<ReviewQueue>;
  /** Fails with kind `Conflict` (extensions `decision`, `decidedBy`) when someone already decided it. */
  approve(id: string): Observable<ApprovalResult>;
  /** Fails with kind `Conflict` and `reason: 'too-late'` after the 8 s window. */
  undoApproval(id: string): Observable<void>;
  /** Records that the caller is looking at a submission; names the other moderators who are. */
  recordPresence(id: string): Observable<{ others: string[] }>;
  /** Fails with kind `Conflict` when someone already decided it. */
  reject(id: string, reason: RejectionReason, message: string | null): Observable<RejectionResult>;
}

export const MODERATION_API = new InjectionToken<ModerationApi>('MODERATION_API');

@Injectable()
export class HttpModerationApi implements ModerationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getQueue(): Observable<ReviewQueue> {
    return this.http.get<ReviewQueue>(`${this.baseUrl}/api/moderation/queue`);
  }

  approve(id: string): Observable<ApprovalResult> {
    return this.http.post<ApprovalResult>(`${this.baseUrl}/api/moderation/submissions/${id}/approve`, null);
  }

  undoApproval(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/moderation/submissions/${id}/undo-approval`, null);
  }

  reject(id: string, reason: RejectionReason, message: string | null): Observable<RejectionResult> {
    return this.http.post<RejectionResult>(`${this.baseUrl}/api/moderation/submissions/${id}/reject`, {
      reason,
      message,
    });
  }

  recordPresence(id: string): Observable<{ others: string[] }> {
    return this.http.post<{ others: string[] }>(
      `${this.baseUrl}/api/moderation/submissions/${id}/presence`,
      null,
    );
  }
}
