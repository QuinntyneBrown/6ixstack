import { Injectable } from '@angular/core';

const PREFIX = 'sx-submission-banner-dismissed:';

/** Remembers dismissed submission banners by key in this browser (L2-053 criterion 4); a newer outcome has a new key. */
@Injectable({ providedIn: 'root' })
export class SubmissionBannerDismissals {
  private readonly memory = new Set<string>();

  isDismissed(key: string): boolean {
    try {
      return localStorage.getItem(PREFIX + key) === '1' || this.memory.has(key);
    } catch {
      return this.memory.has(key);
    }
  }

  dismiss(key: string): void {
    this.memory.add(key);
    try {
      localStorage.setItem(PREFIX + key, '1');
    } catch {
      // Storage blocked: the in-memory record covers this page.
    }
  }
}
