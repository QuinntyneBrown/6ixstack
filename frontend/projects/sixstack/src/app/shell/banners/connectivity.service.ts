import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from 'api';
import { Subject } from 'rxjs';
import { formatTorontoTime } from '../../shared/toronto-time';
import { BannerService } from './banner.service';

/**
 * Tracks whether the browser is online and the API reachable (L2-075). Offline shows a warning banner and
 * disables submitting; coming back shows a success banner. A request that fails with no response while online
 * shows the API-unreachable banner and probes `/health/live` every 30 s; Retry now probes at once.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  static readonly PROBE_INTERVAL_MS = 30_000;

  private readonly banners = inject(BannerService);
  // Probes bypass the interceptors, so a failed probe is not reported as another network error.
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly window = inject(DOCUMENT).defaultView;
  private probeTimer?: ReturnType<typeof setInterval>;

  readonly online = signal(this.window?.navigator.onLine ?? true);
  readonly apiReachable = signal(true);
  /** Emits when data on the current page should be reloaded (connection or API back). */
  readonly refresh$ = new Subject<void>();

  constructor() {
    const onOffline = () => this.wentOffline();
    const onOnline = () => this.cameOnline();
    this.window?.addEventListener('offline', onOffline);
    this.window?.addEventListener('online', onOnline);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('offline', onOffline);
      this.window?.removeEventListener('online', onOnline);
      clearInterval(this.probeTimer);
    });
    if (!this.online()) {
      this.wentOffline();
    }
  }

  /** Called by the API error interceptor when a request got no response. */
  reportNetworkError(): void {
    if (!this.online() || !this.apiReachable()) {
      return;
    }
    this.apiReachable.set(false);
    this.banners.set('connectivity', {
      id: 'api-unreachable',
      kind: 'danger',
      role: 'alert',
      title: "We can't reach 6ixstack",
      text: 'Retrying in 30 seconds. The events below may be out of date.',
      dismissible: false,
      actions: [{ label: 'Retry now', run: () => this.retryNow() }],
    });
    this.startProbing();
  }

  retryNow(): void {
    this.startProbing();
    this.probe();
  }

  private wentOffline(): void {
    this.online.set(false);
    this.stopProbing();
    this.apiReachable.set(true);
    this.banners.set('connectivity', {
      id: 'offline',
      kind: 'warning',
      role: 'status',
      title: "You're offline",
      text: 'Pages you open may be out of date. Submitting and feeds need a connection.',
      dismissible: false,
    });
  }

  private cameOnline(): void {
    this.online.set(true);
    this.banners.set('connectivity', {
      id: 'back-online',
      kind: 'success',
      role: 'status',
      title: "You're back online",
      text: `Events are up to date as of ${formatTorontoTime(new Date())}.`,
      dismissible: true,
    });
    this.refresh$.next();
  }

  private startProbing(): void {
    this.stopProbing();
    this.probeTimer = setInterval(() => this.probe(), ConnectivityService.PROBE_INTERVAL_MS);
  }

  private stopProbing(): void {
    clearInterval(this.probeTimer);
    this.probeTimer = undefined;
  }

  private probe(): void {
    this.http.get(`${this.baseUrl}/health/live`, { responseType: 'text' }).subscribe({
      next: () => {
        this.stopProbing();
        this.apiReachable.set(true);
        this.banners.clear('connectivity');
        this.refresh$.next();
      },
      error: () => undefined,
    });
  }
}
