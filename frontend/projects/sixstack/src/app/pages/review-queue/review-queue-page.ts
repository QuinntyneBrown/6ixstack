import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError, ApprovalResult, MODERATION_API, ReviewCardData, ReviewQueue } from 'api';
import {
  Alert,
  Button,
  EmptyState,
  Icon,
  isTopic,
  modalDialogConfig,
  ReviewCard,
  Skeleton,
  ToastService,
  TopicKey,
} from 'components';
import {
  REJECT_SUBMISSION_TITLE_ID,
  RejectSubmissionDialog,
  RejectSubmissionDialogData,
  RejectSubmissionOutcome,
} from '../../dialogs/reject-submission/reject-submission-dialog';
import { SENT_EMAIL_TITLE_ID, SentEmailDialog } from '../../dialogs/sent-email/sent-email-dialog';
import { catchError, finalize, map, of, switchMap, timer } from 'rxjs';
import { SessionStore } from '../../shell/session/session-store';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import { ReviewPresenceTracker } from './review-presence-tracker';
import { ReviewQueueShortcuts } from './review-queue-shortcuts';

/** The review queue (`/admin/review`): waiting submissions, their checks and approval (moderation design). */
@Component({
  selector: 'sx-review-queue-page',
  imports: [Alert, Button, EmptyState, Icon, ReviewCard, ReviewQueueShortcuts, RouterLink, Skeleton],
  providers: [ReviewPresenceTracker],
  templateUrl: './review-queue-page.html',
  styleUrl: './review-queue-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage {
  private readonly moderation = inject(MODERATION_API);
  private readonly toasts = inject(ToastService);
  private readonly presence = inject(ReviewPresenceTracker);
  private readonly dialog = inject(Dialog);
  protected readonly session = inject(SessionStore);

  private readonly reload = signal(0);
  protected readonly state = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        this.moderation.getQueue().pipe(
          map((queue): LoadState<ReviewQueue> => loaded(queue)),
          catchError((error: unknown) => of(failed<ReviewQueue>(error))),
        ),
      ),
    ),
    { initialValue: loading<ReviewQueue>() },
  );
  /** True once the queue has taken longer than 300 ms (DelayedSkeleton, L2-058). */
  protected readonly slow = toSignal(timer(SKELETON_DELAY_MS).pipe(map(() => true)), { initialValue: false });

  /** Cards decided on this page since the last load. */
  private readonly removed = signal<ReadonlySet<string>>(new Set());
  protected readonly approving = signal<ReadonlySet<string>>(new Set());
  protected readonly cards = computed(() => {
    const s = this.state();
    const gone = this.removed();
    return s.status === 'loaded' ? s.data.cards.filter((c) => !gone.has(c.id)) : [];
  });

  protected readonly forbidden = computed(() => {
    const s = this.state();
    return s.status === 'failed' && s.error instanceof ApiError && s.error.kind === 'Forbidden';
  });
  protected readonly lead = computed(() => {
    const s = this.state();
    if (s.status === 'loaded') return s.data.summary;
    if (s.status === 'loading') return this.slow() ? 'Loading submissions…' : '';
    return this.forbidden() ? 'You don’t have access to this page' : 'Queue unavailable';
  });

  protected topics(card: ReviewCardData): TopicKey[] {
    return card.topics.filter(isTopic);
  }

  protected retry(): void {
    this.removed.set(new Set());
    this.reload.update((n) => n + 1);
  }

  protected onFocusIn(event: FocusEvent): void {
    const element = (event.target as HTMLElement).closest<HTMLElement>('.review-card');
    const card = element && this.cards().find((c) => c.id === element.dataset['id']);
    if (card) this.presence.watch(card.id, card.title);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as HTMLElement | null;
    if (!next?.closest('.review-card')) this.presence.stop();
  }

  protected rejectFocused(element: HTMLElement): void {
    const card = this.cards().find((c) => c.id === element.dataset['id']);
    if (card) this.openReject(card, element);
  }

  /** Opens Reject “{title}”? (L2-061) and reports how it ended. */
  protected openReject(card: ReviewCardData, trigger: EventTarget | null): void {
    const ref = this.dialog.open<RejectSubmissionOutcome, RejectSubmissionDialogData>(
      RejectSubmissionDialog,
      modalDialogConfig({
        data: {
          eventId: card.id,
          title: card.title,
          organizerName: card.organizer,
          submitterEmail: card.submitterEmail,
        },
        ariaLabelledBy: REJECT_SUBMISSION_TITLE_ID,
        ariaDescribedBy: 'reject-description',
        restoreFocus: (trigger as HTMLElement | null) ?? true,
      }),
    );
    ref.closed.subscribe((outcome) => {
      if (!outcome) return;
      this.remove(card);
      if (outcome.kind === 'conflict') {
        this.toasts.show({
          kind: 'info',
          title: `${outcome.decidedBy ?? 'Another moderator'} already ${outcome.decision} “${card.title}”`,
          text: 'It’s no longer in the queue.',
        });
        return;
      }
      const { result } = outcome;
      const sentBack = result.status === 'needsChanges';
      this.toasts.show({
        kind: 'info',
        title: sentBack ? `Sent “${result.title}” back for changes` : `Rejected “${result.title}”`,
        text: sentBack
          ? `${result.organizerName} was emailed what to fix.`
          : `${result.organizerName} was emailed your reason.`,
        action: {
          label: 'View email',
          run: () =>
            this.dialog.open(
              SentEmailDialog,
              modalDialogConfig({ data: result.emailPreview, ariaLabelledBy: SENT_EMAIL_TITLE_ID }),
            ),
        },
      });
    });
  }

  protected approveFocused(element: HTMLElement): void {
    const card = this.cards().find((c) => c.id === element.dataset['id']);
    if (card) this.approve(card);
  }

  /** Approves a card (L2-060), then says how it went in a toast; a 409 means someone decided first (L2-063). */
  protected approve(card: ReviewCardData): void {
    if (this.approving().has(card.id)) return;
    this.approving.update((s) => new Set(s).add(card.id));
    this.moderation
      .approve(card.id)
      .pipe(finalize(() => this.approving.update((s) => without(s, card.id))))
      .subscribe({
        next: (result) => {
          this.remove(card);
          this.announceApproval(card, result);
        },
        error: (error: unknown) => {
          if (error instanceof ApiError && error.kind === 'Conflict') {
            this.remove(card);
            const by = (error.extensions['decidedBy'] as string | null) ?? 'Another moderator';
            const decision = (error.extensions['decision'] as string | null) ?? 'decided';
            this.toasts.show({
              kind: 'info',
              title: `${by} already ${decision} “${card.title}”`,
              text: 'It’s no longer in the queue.',
            });
          } else {
            this.toasts.show({
              kind: 'danger',
              title: `Couldn’t approve “${card.title}”`,
              text: 'It’s still in the queue. Try again.',
              action: { label: 'Try again', run: () => this.approve(card) },
            });
          }
        },
      });
  }

  private announceApproval(card: ReviewCardData, result: ApprovalResult): void {
    const duplicate = result.possibleDuplicate;
    if (duplicate) {
      this.toasts.show({
        kind: 'warning',
        title: 'Approved with a possible duplicate',
        text: `“${result.title}” may duplicate a ${duplicate.dateLabel} listing.`,
        action: {
          label: 'Compare',
          run: () => window.open(`/events/${duplicate.slug}`, '_blank', 'noopener'),
        },
      });
      return;
    }
    this.toasts.show({
      kind: 'success',
      title: `Approved “${result.title}”`,
      text: result.isPublished
        ? `It’s live and ${result.organizerName} will be notified.`
        : `It goes live when ${result.organizerName} verifies their email.`,
      action: { label: 'Undo', run: () => this.undo(card, result) },
    });
  }

  private undo(card: ReviewCardData, result: ApprovalResult): void {
    this.moderation.undoApproval(card.id).subscribe({
      next: () => this.retry(),
      error: (error: unknown) => {
        if (error instanceof ApiError && error.kind === 'Conflict') {
          this.toasts.show({
            kind: 'info',
            title: `Too late to undo “${card.title}”`,
            text: `It’s live and ${result.organizerName} will be notified.`,
          });
        } else {
          this.toasts.show({
            kind: 'danger',
            title: `Couldn’t undo “${card.title}”`,
            text: 'It’s still approved. Try again.',
            action: { label: 'Try again', run: () => this.undo(card, result) },
          });
        }
      },
    });
  }

  /** Takes a decided card out of the list and moves focus to its neighbour, so J and K carry on. */
  private remove(card: ReviewCardData): void {
    const list = this.cards();
    const index = list.findIndex((c) => c.id === card.id);
    const neighbour = list[index + 1] ?? list[index - 1];
    this.removed.update((s) => new Set(s).add(card.id));
    if (neighbour) {
      queueMicrotask(() =>
        document.querySelector<HTMLElement>(`.review-card[data-id="${neighbour.id}"]`)?.focus(),
      );
    }
  }
}

function without(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(set);
  next.delete(id);
  return next;
}
