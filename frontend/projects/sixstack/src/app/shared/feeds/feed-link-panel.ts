import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Button, FormField, Icon, Input, OptionButton } from 'components';
import { FeedLinkCopier, feedLink } from './feed-link-copier';

/**
 * A created feed (build-custom-feed design): the read-only link with Copy, and Google Calendar, Outlook and Apple
 * Calendar options. Links are built on the serving host, like ready-made feeds.
 */
@Component({
  selector: 'sx-feed-link-panel',
  imports: [Button, FormField, Icon, Input, OptionButton],
  template: `
    <sx-form-field label="Feed link" controlId="feed-url">
      <div class="copy-field">
        <input sx-input id="feed-url" readonly [value]="webcal()" />
        <button sx-button type="button" (click)="copy()"><sx-icon name="copy" size="sm" />Copy</button>
      </div>
    </sx-form-field>
    <ul class="option-list">
      <li>
        <a
          sx-option-button
          icon="calendar"
          endIcon="external"
          [href]="google()"
          target="_blank"
          rel="noopener noreferrer"
          >Google Calendar</a
        >
      </li>
      <li>
        <a
          sx-option-button
          icon="calendar"
          endIcon="external"
          [href]="outlook()"
          target="_blank"
          rel="noopener noreferrer"
          >Outlook</a
        >
      </li>
      <li>
        <a sx-option-button icon="calendar" endIcon="external" [href]="webcal()">Apple Calendar</a>
      </li>
    </ul>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--spacingHorizontalL);
      width: 100%;
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
export class FeedLinkPanel {
  private readonly copier = inject(FeedLinkCopier);
  private readonly host = inject(DOCUMENT).location.host;

  readonly slug = input.required<string>();
  /** Where "How to subscribe" on the copied toast takes the visitor. */
  readonly howToSubscribe = input<() => void>(() => undefined);

  protected readonly webcal = computed(() => feedLink(this.slug(), this.host));
  protected readonly google = computed(
    () => `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(this.webcal())}`,
  );
  protected readonly outlook = computed(
    () => `https://outlook.live.com/calendar/addcalendar?url=${encodeURIComponent(this.webcal())}`,
  );

  protected copy(): void {
    this.copier.copy(this.webcal(), this.howToSubscribe());
  }
}
