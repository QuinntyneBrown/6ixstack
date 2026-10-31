import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** The signed-in user, as the header shows them (L2-050). */
export interface CurrentUser {
  name: string;
  email: string;
  initials: string;
  role: 'organizer' | 'moderator';
  unreadNotificationCount: number;
}

export interface AuthApi {
  /** Emails a sign-in link; succeeds the same way whether or not the account exists. */
  requestSignInLink(email: string, returnUrl?: string | null): Observable<void>;
  /** The signed-in user; fails with a 401 `ApiError` when anonymous. */
  me(): Observable<CurrentUser>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  requestSignInLink(email: string, returnUrl?: string | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/sign-in-links`, {
      email,
      returnUrl: returnUrl ?? null,
    });
  }

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/api/auth/me`);
  }
}
