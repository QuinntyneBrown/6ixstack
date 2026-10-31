import { DestroyRef, inject, Injectable } from '@angular/core';
import { MODERATION_API } from 'api';
import { ToastService } from 'components';

/**
 * While a card holds focus, tells the API every 20 s that this moderator is looking at it, and names the other
 * moderators who are, once per person and submission (L2-063, approve-submission design).
 */
@Injectable()
export class ReviewPresenceTracker {
  static readonly INTERVAL_MS = 20_000;

  private readonly moderation = inject(MODERATION_API);
  private readonly toasts = inject(ToastService);
  private readonly announced = new Set<string>();
  private current: { id: string; title: string; timer: ReturnType<typeof setInterval> } | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  watch(id: string, title: string): void {
    if (this.current?.id === id) return;
    this.stop();
    this.current = {
      id,
      title,
      timer: setInterval(() => this.post(id, title), ReviewPresenceTracker.INTERVAL_MS),
    };
    this.post(id, title);
  }

  stop(): void {
    if (this.current) clearInterval(this.current.timer);
    this.current = null;
  }

  private post(id: string, title: string): void {
    this.moderation.recordPresence(id).subscribe({
      next: ({ others }) => {
        for (const name of others) {
          const key = `${name}:${id}`;
          if (this.announced.has(key)) continue;
          this.announced.add(key);
          this.toasts.show({
            kind: 'info',
            title: `${name} is also reviewing “${title}”`,
            text: 'Your actions won’t clash; the first decision wins.',
          });
        }
      },
      error: () => undefined, // Presence is a courtesy; a failed post changes nothing.
    });
  }
}
