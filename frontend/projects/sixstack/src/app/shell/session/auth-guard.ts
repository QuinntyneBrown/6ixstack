import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SessionStore } from './session-store';

/** Sends an anonymous visitor to `/sign-in?returnUrl=<path>` (L2-048). Role checks arrive with journey 06. */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(SessionStore)
    .load()
    .pipe(
      map(
        (user) =>
          user !== null || router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } }),
      ),
    );
};
