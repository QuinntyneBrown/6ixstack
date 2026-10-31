import { Dialog } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { modalDialogConfig } from 'components';
import {
  SHARE_EVENT_DESCRIPTION_ID,
  SHARE_EVENT_TITLE_ID,
  ShareEventDialog,
  ShareEventDialogData,
} from '../../dialogs/share-event/share-event-dialog';

export interface ShareableEvent {
  slug: string;
  title: string;
  summary: string;
}

/**
 * Share (L2-038): below 768 px with the Web Share API it opens the system sheet with the title and short link;
 * otherwise, or when the sheet fails for any reason but the visitor dismissing it, the share dialog.
 */
@Injectable({ providedIn: 'root' })
export class ShareLauncher {
  private readonly dialog = inject(Dialog);
  private readonly document = inject(DOCUMENT);

  share(event: ShareableEvent, trigger: HTMLElement | null): void {
    const link = `${this.document.location.origin}/e/${event.slug}`;
    const nav = this.document.defaultView?.navigator;
    const narrow = this.document.defaultView?.matchMedia('(max-width: 767.98px)').matches ?? false;
    if (narrow && nav && typeof nav.share === 'function') {
      nav.share({ title: event.title, url: link }).catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError'))
          this.openDialog(event, link, trigger);
      });
      return;
    }
    this.openDialog(event, link, trigger);
  }

  private openDialog(event: ShareableEvent, link: string, trigger: HTMLElement | null): void {
    this.dialog.open<unknown, ShareEventDialogData>(
      ShareEventDialog,
      modalDialogConfig({
        data: { title: event.title, summary: event.summary, link },
        ariaLabelledBy: SHARE_EVENT_TITLE_ID,
        ariaDescribedBy: SHARE_EVENT_DESCRIPTION_ID,
        restoreFocus: trigger ?? true,
      }),
    );
  }
}
