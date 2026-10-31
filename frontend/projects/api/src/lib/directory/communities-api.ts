import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export type CommunitySort = 'members' | 'next' | 'name';

export interface CommunitiesQuery {
  q?: string;
  topic?: string | null;
  city?: string | null;
  sort?: CommunitySort;
  page?: number;
}

export interface CommunityCard {
  slug: string;
  name: string;
  initials: string;
  city: string;
  memberCount: number;
  audienceLabel: string;
  description: string;
  topics: string[];
  nextEvent: { slug: string; title: string; dateLabel: string } | null;
}

export interface CommunityDirectory {
  listedTotal: number;
  matchCount: number;
  items: CommunityCard[];
  hasMore: boolean;
}

export interface CommunitiesApi {
  /** The communities directory: 10 on page 1, 20 on each later page (L2-029). */
  list(query: CommunitiesQuery): Observable<CommunityDirectory>;
}

export const COMMUNITIES_API = new InjectionToken<CommunitiesApi>('COMMUNITIES_API');

@Injectable()
export class HttpCommunitiesApi implements CommunitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(query: CommunitiesQuery): Observable<CommunityDirectory> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.topic) params = params.set('topic', query.topic);
    if (query.city) params = params.set('city', query.city);
    if (query.sort && query.sort !== 'members') params = params.set('sort', query.sort);
    if (query.page && query.page > 1) params = params.set('page', query.page);
    return this.http.get<CommunityDirectory>(`${this.baseUrl}/api/communities`, { params });
  }
}
