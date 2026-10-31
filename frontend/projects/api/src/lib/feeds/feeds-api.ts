import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface ReadyMadeFeedCounts {
  feeds: { key: string; feedSlug: string; upcomingCount: number }[];
}

export type FeedScope = 'all' | 'gtaOnly' | 'streamingOnly';

export interface FeedChoice {
  topics: string[];
  allTopics: boolean;
  scope: FeedScope;
  communitySlug?: string | null;
}

export interface CreatedFeed {
  feedSlug: string;
  webcalUrl: string;
  googleCalendarUrl: string;
  outlookUrl: string;
  appleCalendarUrl: string;
  summary: string;
  matchingEventCount: number;
}

export interface FeedsApi {
  /** How many events each ready-made feed holds in the next two weeks. */
  readyMadeCounts(): Observable<ReadyMadeFeedCounts>;
  /** A custom feed link for a choice; fails with kind `Validation` without a topic. */
  createFeed(choice: FeedChoice): Observable<CreatedFeed>;
}

export const FEEDS_API = new InjectionToken<FeedsApi>('FEEDS_API');

@Injectable()
export class HttpFeedsApi implements FeedsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  createFeed(choice: FeedChoice): Observable<CreatedFeed> {
    return this.http.post<CreatedFeed>(`${this.baseUrl}/api/feeds`, choice);
  }

  readyMadeCounts(): Observable<ReadyMadeFeedCounts> {
    return this.http.get<ReadyMadeFeedCounts>(`${this.baseUrl}/api/feeds`);
  }
}
