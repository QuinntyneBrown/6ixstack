import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface ReadyMadeFeedCounts {
  feeds: { key: string; feedSlug: string; upcomingCount: number }[];
}

export interface FeedsApi {
  /** How many events each ready-made feed holds in the next two weeks. */
  readyMadeCounts(): Observable<ReadyMadeFeedCounts>;
}

export const FEEDS_API = new InjectionToken<FeedsApi>('FEEDS_API');

@Injectable()
export class HttpFeedsApi implements FeedsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readyMadeCounts(): Observable<ReadyMadeFeedCounts> {
    return this.http.get<ReadyMadeFeedCounts>(`${this.baseUrl}/api/feeds`);
  }
}
