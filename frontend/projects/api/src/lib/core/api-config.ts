import { InjectionToken } from '@angular/core';

/** Base URL every API client prefixes to its paths. The app serves the API under the same origin (`/api`). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '',
});
