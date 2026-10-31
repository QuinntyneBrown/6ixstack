import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { UpcomingEvents } from '../events/events-api';

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

export interface CommunityDetail {
  slug: string;
  name: string;
  initials: string;
  tagline: string;
  topics: string[];
  about: string[];
  upcoming: UpcomingEvents['days'];
  past: { slug: string; title: string; dateLabel: string; attendedCount: number }[];
  facts: {
    audienceLabel: string;
    cadenceLabel: string | null;
    placesLabel: string;
    placesDetail: string | null;
    websiteLabel: string | null;
    websiteUrl: string | null;
    links: { label: string; url: string }[];
    postingLeadLabel: string;
  };
  organizers: { name: string; initials: string; roleLabel: string; speakerSlug: string | null }[];
}

export interface CommunitiesApi {
  /** A community's page; fails with `ApiError` kind `NotFound` for an unknown slug (L2-031). */
  get(slug: string): Observable<CommunityDetail>;
  /** The communities directory: 10 on page 1, 20 on each later page (L2-029). */
  list(query: CommunitiesQuery): Observable<CommunityDirectory>;
}

export const COMMUNITIES_API = new InjectionToken<CommunitiesApi>('COMMUNITIES_API');

@Injectable()
export class HttpCommunitiesApi implements CommunitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(slug: string): Observable<CommunityDetail> {
    return this.http.get<CommunityDetail>(`${this.baseUrl}/api/communities/${encodeURIComponent(slug)}`);
  }

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
