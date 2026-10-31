import { computed, Injectable, signal } from '@angular/core';
import { BANNER_ORDER, BannerSource, SiteBanner } from './site-banner';

/** Holds the active banner for each source: connectivity, version and maintenance. */
@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly bySource = signal<Partial<Record<BannerSource, SiteBanner>>>({});

  readonly banners = computed(() =>
    BANNER_ORDER.map((source) => this.bySource()[source]).filter((b): b is SiteBanner => !!b),
  );

  set(source: BannerSource, banner: SiteBanner): void {
    this.bySource.update((all) => ({ ...all, [source]: banner }));
  }

  clear(source: BannerSource): void {
    this.bySource.update((all) => ({ ...all, [source]: undefined }));
  }

  dismiss(banner: SiteBanner): void {
    const source = BANNER_ORDER.find((s) => this.bySource()[s]?.id === banner.id);
    if (source) {
      this.clear(source);
      banner.onDismiss?.();
    }
  }
}
