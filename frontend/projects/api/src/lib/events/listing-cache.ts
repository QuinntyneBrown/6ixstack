import { catchError, concat, EMPTY, filter, Observable, of, tap } from 'rxjs';

/**
 * The listing responses saved for the visit (platform/event-listing-cache, L2-130): the most recent
 * {@link ListingCache.limit} responses, in memory only, keyed by request.
 */
export class ListingCache {
  private readonly entries = new Map<string, unknown>();

  constructor(readonly limit = 20) {}

  /**
   * With nothing saved for `key`, loads, saves and emits the response, failing as the request fails. With a
   * saved response, emits it at once, then runs a quiet refresh (`load(true)`, which must bypass the browser's
   * HTTP cache), emits the new response only if it differs, and completes without an error if the refresh fails,
   * so the saved listing stays on screen.
   */
  cached<T>(key: string, load: (refresh: boolean) => Observable<T>): Observable<T> {
    if (!this.entries.has(key)) {
      return load(false).pipe(tap((response) => this.save(key, response)));
    }
    const saved = this.entries.get(key) as T;
    this.save(key, saved);
    const before = JSON.stringify(saved);
    return concat(
      of(saved),
      load(true).pipe(
        tap((response) => this.save(key, response)),
        filter((response) => JSON.stringify(response) !== before),
        catchError(() => EMPTY),
      ),
    );
  }

  /** Saves `response` as the most recently used entry, dropping the least recently used beyond the limit. */
  private save(key: string, response: unknown): void {
    this.entries.delete(key);
    this.entries.set(key, response);
    if (this.entries.size > this.limit) {
      this.entries.delete(this.entries.keys().next().value!);
    }
  }
}
