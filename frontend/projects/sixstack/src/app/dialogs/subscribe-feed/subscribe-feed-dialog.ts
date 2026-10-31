import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { CreatedFeed, FEEDS_API } from 'api';
import { Alert, Button, DialogShell } from 'components';
import { FeedBuilder } from '../../shared/feeds/feed-builder';
import { FeedLinkPanel } from '../../shared/feeds/feed-link-panel';

export const SUBSCRIBE_FEED_TITLE_ID = 'sx-subscribe-feed-title';

/** Opened from a community page in journey 19 with its community; from elsewhere with none. */
export interface SubscribeFeedDialogData {
  communitySlug?: string;
  communityName?: string;
}

/** "Subscribe to a calendar feed" (dialogs/subscribe-feed, L2-035): build a feed and get its link. */
@Component({
  selector: 'sx-subscribe-feed-dialog',
  imports: [Alert, Button, DialogShell, FeedBuilder, FeedLinkPanel],
  template: `
    <sx-dialog-shell title="Subscribe to a calendar feed" [titleId]="titleId" size="lg">
      @if (!created()) {
        <p slot="description" id="subscribe-feed-description">
          Your calendar app checks the feed every few hours, so new and changed events show up on their own.
        </p>
      }
      <div class="feed-body">
        @if (created(); as feed) {
          <sx-alert kind="success" title="Your feed is ready">
            {{ feed.summary }} {{ feed.matchingEventCount }} events right now.
          </sx-alert>
          <sx-feed-link-panel [slug]="feed.feedSlug" />
        } @else {
          @if (failed()) {
            <sx-alert kind="danger" announce="alert" title="We couldn’t create your feed">
              Your choices are saved. Try again, or use the full feed for all events.
            </sx-alert>
          }
          <sx-feed-builder [busy]="creating()" />
        }
      </div>
      @if (created()) {
        <button #done slot="footer" sx-button appearance="primary" type="button" (click)="close()">
          Done
        </button>
      } @else {
        <button slot="footer" sx-button type="button" (click)="close()">Cancel</button>
        <button
          slot="footer"
          sx-button
          appearance="primary"
          type="button"
          [busy]="creating()"
          (click)="create()"
        >
          {{ creating() ? 'Creating feed…' : failed() ? 'Try again' : 'Create feed link' }}
        </button>
      }
    </sx-dialog-shell>
  `,
  styles: `
    .feed-body {
      display: grid;
      gap: var(--spacingHorizontalXL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscribeFeedDialog {
  private readonly ref = inject(DialogRef);
  private readonly api = inject(FEEDS_API);
  private readonly data = inject<SubscribeFeedDialogData | null>(DIALOG_DATA, { optional: true });
  private readonly builder = viewChild(FeedBuilder);
  private readonly done = viewChild('done', { read: ElementRef<HTMLButtonElement> });
  private readonly injector = inject(Injector);

  protected readonly titleId = SUBSCRIBE_FEED_TITLE_ID;
  protected readonly creating = signal(false);
  protected readonly failed = signal(false);
  protected readonly created = signal<CreatedFeed | null>(null);

  protected create(): void {
    const choice = this.builder()?.choice();
    if (!choice) return;
    this.creating.set(true);
    this.failed.set(false);
    this.api.createFeed({ ...choice, communitySlug: this.data?.communitySlug ?? null }).subscribe({
      next: (feed) => {
        this.creating.set(false);
        this.created.set(feed);
        // Done takes focus once the success view has rendered (subscribe-feed/success).
        afterNextRender(() => this.done()?.nativeElement.focus(), { injector: this.injector });
      },
      error: () => {
        this.creating.set(false);
        this.failed.set(true);
      },
    });
  }

  /** Cancel stays available while busy (L2-035 criterion 4). */
  protected close(): void {
    this.ref.close();
  }
}
