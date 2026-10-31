import { Clipboard } from '@angular/cdk/clipboard';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Button, DialogShell, FormField, Icon, Input, OptionButton, ToastService } from 'components';

export const SHARE_EVENT_TITLE_ID = 'sx-share-event-title';
export const SHARE_EVENT_DESCRIPTION_ID = 'share-event-description';

export interface ShareEventDialogData {
  title: string;
  /** "Azure Data & AI Day GTA · Thu, Nov 5, 9:00 AM – 5:00 PM ET · Living Arts Centre". */
  summary: string;
  /** The short link, `{origin}/e/{slug}`. */
  link: string;
}

/** "Share this event" (dialogs/share-event, L2-038): the short link with Copy, and LinkedIn, Bluesky and Email. */
@Component({
  selector: 'sx-share-event-dialog',
  imports: [Button, DialogShell, FormField, Icon, Input, OptionButton],
  template: `
    <sx-dialog-shell title="Share this event" [titleId]="titleId">
      <p slot="description" [id]="descriptionId">{{ data.summary }}</p>
      <div class="share-body">
        <sx-form-field label="Event link" controlId="share-url">
          <div class="copy-field">
            <input sx-input id="share-url" readonly [value]="data.link" />
            <button sx-button type="button" cdkFocusInitial aria-live="polite" (click)="copy()">
              @if (copied()) {
                <sx-icon name="check" size="sm" />Copied
              } @else {
                Copy
              }
            </button>
          </div>
        </sx-form-field>
        <ul class="option-list">
          <li>
            <a
              sx-option-button
              icon="link"
              endIcon="external"
              [href]="linkedIn()"
              target="_blank"
              rel="noopener noreferrer"
              >LinkedIn</a
            >
          </li>
          <li>
            <a
              sx-option-button
              icon="send"
              endIcon="external"
              [href]="bluesky()"
              target="_blank"
              rel="noopener noreferrer"
              >Bluesky</a
            >
          </li>
          <li>
            <a sx-option-button icon="mail" endIcon="external" [href]="email()">Email</a>
          </li>
        </ul>
      </div>
    </sx-dialog-shell>
  `,
  styles: `
    .share-body {
      display: grid;
      gap: var(--spacingHorizontalL);
    }
    .copy-field {
      display: flex;
      gap: var(--spacingHorizontalS);
    }
    .copy-field input {
      font: var(--sx-text-code);
      min-width: 0;
    }
    .option-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalS);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareEventDialog {
  static readonly COPIED_MS = 2_000;

  private readonly clipboard = inject(Clipboard);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<ShareEventDialogData>(DIALOG_DATA);
  protected readonly titleId = SHARE_EVENT_TITLE_ID;
  protected readonly descriptionId = SHARE_EVENT_DESCRIPTION_ID;
  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly linkedIn = computed(
    () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.data.link)}`,
  );
  protected readonly bluesky = computed(
    () => `https://bsky.app/intent/compose?text=${encodeURIComponent(this.data.link)}`,
  );
  protected readonly email = computed(
    () => `mailto:?subject=${encodeURIComponent(this.data.title)}&body=${encodeURIComponent(this.data.link)}`,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timer && clearTimeout(this.timer));
  }

  /** "Copied" for 2 s and no toast on success; a danger toast with Try again on failure (L2-038). */
  protected copy(): void {
    if (!this.clipboard.copy(this.data.link)) {
      this.toasts.show({
        kind: 'danger',
        title: 'Couldn’t copy the link',
        text: 'Your browser blocked the clipboard. Try again, or select the link and copy it yourself.',
        action: { label: 'Try again', run: () => this.copy() },
      });
      return;
    }
    this.copied.set(true);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), ShareEventDialog.COPIED_MS);
  }
}
