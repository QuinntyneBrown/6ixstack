import { inject, Injectable, signal } from '@angular/core';
import { AUTH_API, CurrentUser } from 'api';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';

/** The signed-in user, loaded once from `GET /api/auth/me`; null when anonymous (sessions-and-sign-out). */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly auth = inject(AUTH_API);
  private readonly current = signal<CurrentUser | null>(null);
  private loading: Observable<CurrentUser | null> | null = null;

  readonly user = this.current.asReadonly();

  /** Loads the user the first time it is asked for; later calls reuse that answer. */
  load(): Observable<CurrentUser | null> {
    this.loading ??= this.auth.me().pipe(
      map((user): CurrentUser | null => user),
      catchError(() => of(null)),
      tap((user) => this.current.set(user)),
      shareReplay(1),
    );
    return this.loading;
  }
}
