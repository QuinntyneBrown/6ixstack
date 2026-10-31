import { Injectable } from '@angular/core';

const PREFIX = 'sx-banner-dismissed:maintenance:';

/**
 * Remembers dismissed maintenance banners per window in localStorage (functional storage, L2-098). A new window
 * id shows a new banner; keys for other windows are removed on read. Without storage the dismissal lasts for
 * the page's life.
 */
@Injectable({ providedIn: 'root' })
export class BannerDismissalStore {
  private readonly memory = new Set<string>();

  isDismissed(windowId: string): boolean {
    const key = PREFIX + windowId;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX) && k !== key) {
          localStorage.removeItem(k);
        }
      }
      return localStorage.getItem(key) === '1' || this.memory.has(key);
    } catch {
      return this.memory.has(key);
    }
  }

  dismiss(windowId: string): void {
    const key = PREFIX + windowId;
    this.memory.add(key);
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Storage blocked: the in-memory record covers this page.
    }
  }
}
