import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

export interface MaintenanceNotice {
  windowId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  title: string;
  text: string;
}

export interface SiteApi {
  /** The announced maintenance window, or null when there is none. */
  maintenanceNotice(): Observable<MaintenanceNotice | null>;
}

export const SITE_API = new InjectionToken<SiteApi>('SITE_API');

@Injectable()
export class HttpSiteApi implements SiteApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  maintenanceNotice(): Observable<MaintenanceNotice | null> {
    return this.http
      .get<MaintenanceNotice>(`${this.baseUrl}/api/site/notice`, { observe: 'response' })
      .pipe(map((response) => (response.status === 200 ? response.body : null)));
  }
}
