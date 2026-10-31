import { inject, Injectable } from '@angular/core';
import { SITE_API } from 'api';
import { BannerDismissalStore } from './banner-dismissal-store';
import { BannerService } from './banner.service';

/** Reads the announced maintenance window at start-up and shows it as a dismissable banner (L2-075). */
@Injectable({ providedIn: 'root' })
export class MaintenanceNoticeSource {
  private readonly site = inject(SITE_API);
  private readonly banners = inject(BannerService);
  private readonly dismissals = inject(BannerDismissalStore);

  load(): void {
    this.site.maintenanceNotice().subscribe({
      next: (notice) => {
        if (!notice || this.dismissals.isDismissed(notice.windowId)) {
          this.banners.clear('maintenance');
          return;
        }
        this.banners.set('maintenance', {
          id: `maintenance-${notice.windowId}`,
          kind: 'info',
          role: null,
          title: notice.title,
          text: notice.text,
          dismissible: true,
          onDismiss: () => this.dismissals.dismiss(notice.windowId),
        });
      },
      error: () => undefined,
    });
  }
}
