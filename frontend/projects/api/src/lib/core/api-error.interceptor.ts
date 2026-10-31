import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiErrorKind } from './api-error';

/** Told when a request fails with no response, so the app can tell offline from "API unreachable". */
export const NETWORK_ERROR_LISTENER = new InjectionToken<() => void>('NETWORK_ERROR_LISTENER');

const kindOf = (status: number): ApiErrorKind => {
  if (status === 0) return 'Network';
  if (status === 400) return 'Validation';
  if (status === 403) return 'Forbidden';
  if (status === 404) return 'NotFound';
  if (status === 409) return 'Conflict';
  if (status === 429) return 'RateLimited';
  if (status >= 500) return 'Server';
  return 'Other';
};

/**
 * Maps every failed response to a typed {@link ApiError}. It keeps the status, field errors, reference code and
 * the forbidden extensions, and discards server titles and details so no internal text reaches the screen.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const onNetworkError = inject(NETWORK_ERROR_LISTENER, { optional: true });
  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      const kind = kindOf(error.status);
      if (kind === 'Network') {
        onNetworkError?.();
      }
      const body = (typeof error.error === 'object' && error.error) || {};
      const { errors, referenceCode, ownerName, resourceTitle, decision, decidedBy, reason } = body as Record<
        string,
        unknown
      >;
      return throwError(
        () =>
          new ApiError(
            kind,
            error.status,
            (errors as Record<string, string[]>) ?? {},
            typeof referenceCode === 'string' ? referenceCode : null,
            { ownerName, resourceTitle, decision, decidedBy, reason },
          ),
      );
    }),
  );
};
