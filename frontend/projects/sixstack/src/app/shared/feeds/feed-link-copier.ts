import { Clipboard } from '@angular/cdk/clipboard';
import { inject, Injectable } from '@angular/core';
import { ToastService } from 'components';

/** The `webcal://` link of a feed slug, on the host the site is served from (ready-made-feeds design). */
export function feedLink(slug: string, host: string): string {
  return `webcal://${host}/feeds/${slug}.ics`;
}

/**
 * Copies feed links for every feed action (L2-034): a success toast with "How to subscribe", or a danger toast
 * with Try again that stays until dismissed.
 */
@Injectable({ providedIn: 'root' })
export class FeedLinkCopier {
  private readonly clipboard = inject(Clipboard);
  private readonly toasts = inject(ToastService);

  copy(link: string, howToSubscribe: () => void): void {
    if (this.clipboard.copy(link)) {
      this.toasts.show({
        kind: 'success',
        title: 'Feed link copied',
        text: 'Paste it into Google Calendar, Outlook or Apple Calendar.',
        action: { label: 'How to subscribe', run: howToSubscribe },
      });
    } else {
      this.toasts.show({
        kind: 'danger',
        title: 'Couldn’t copy the link',
        text: 'Your browser blocked the clipboard. Try again, or select the link and copy it yourself.',
        action: { label: 'Try again', run: () => this.copy(link, howToSubscribe) },
      });
    }
  }
}
