import { Injectable } from '@angular/core';

/**
 * Unsent form values kept in browser storage on this device (L2-044). Storage can be blocked or full; then the form
 * simply works without a draft.
 */
@Injectable({ providedIn: 'root' })
export class DraftStore {
  read<T>(key: string): Partial<T> | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Partial<T>) : null;
    } catch {
      return null;
    }
  }

  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked or full: no draft.
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing stored.
    }
  }
}
