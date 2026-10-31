import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiError, MODERATION_API, RejectionReason, RejectionResult } from 'api';
import {
  Alert,
  Button,
  Check,
  Choice,
  describedBy,
  DialogShell,
  FieldSet,
  FormField,
  Input,
} from 'components';

export const REJECT_SUBMISSION_TITLE_ID = 'sx-reject-submission-title';

export interface RejectSubmissionDialogData {
  eventId: string;
  title: string;
  organizerName: string;
  submitterEmail: string;
}

/** What the dialog closed with: the rejection, or the 409 saying someone else decided first. */
export type RejectSubmissionOutcome =
  | { kind: 'rejected'; result: RejectionResult }
  | { kind: 'conflict'; decision: string; decidedBy: string | null };

const REASONS: { value: RejectionReason; label: string }[] = [
  { value: 'missingVenueAddress', label: 'Missing or unclear venue address' },
  { value: 'notDeveloperEvent', label: 'Not a developer event' },
  { value: 'duplicate', label: 'Duplicate of an existing listing' },
  { value: 'spamOrAdvertising', label: 'Spam or advertising' },
  { value: 'codeOfConduct', label: 'Breaks the code of conduct' },
];

/** Reject “{title}”? (dialogs/reject-submission, L2-061): a required reason, an optional message, busy and failed states. */
@Component({
  selector: 'sx-reject-submission-dialog',
  imports: [Alert, Button, Check, Choice, DialogShell, FieldSet, FormField, Input, ReactiveFormsModule],
  templateUrl: './reject-submission-dialog.html',
  styles: `
    .reject-body {
      display: grid;
      gap: var(--spacingHorizontalXL);
    }
    .reasons {
      display: grid;
    }
    .reject-failure {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectSubmissionDialog {
  private readonly ref = inject<DialogRef<RejectSubmissionOutcome>>(DialogRef);
  private readonly moderation = inject(MODERATION_API);
  private readonly injector = inject(Injector);
  protected readonly data = inject<RejectSubmissionDialogData>(DIALOG_DATA);

  protected readonly titleId = REJECT_SUBMISSION_TITLE_ID;
  protected readonly reasons = REASONS;
  protected readonly describedBy = describedBy;
  protected readonly reason = new FormControl<RejectionReason | null>(null);
  protected readonly message = new FormControl('', { nonNullable: true });
  protected readonly reasonError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected submit(): void {
    const reason = this.reason.value;
    if (!reason) {
      this.reasonError.set('Choose a reason. The organizer sees it in their email.');
      afterNextRender(() => document.getElementById('reason-0')?.focus(), { injector: this.injector });
      return;
    }
    this.reasonError.set(null);
    this.setBusy(true);
    this.moderation.reject(this.data.eventId, reason, this.message.value.trim() || null).subscribe({
      next: (result) => this.ref.close({ kind: 'rejected', result }),
      error: (error: unknown) => {
        if (error instanceof ApiError && error.kind === 'Conflict') {
          this.ref.close({
            kind: 'conflict',
            decision: (error.extensions['decision'] as string | null) ?? 'decided',
            decidedBy: (error.extensions['decidedBy'] as string | null) ?? null,
          });
          return;
        }
        this.setBusy(false);
        this.failed.set(true);
      },
    });
  }

  protected cancel(): void {
    if (!this.busy()) this.ref.close();
  }

  /** While busy the choices are disabled and Escape or the backdrop cannot close the dialog. */
  private setBusy(busy: boolean): void {
    this.busy.set(busy);
    this.ref.disableClose = busy;
    if (busy) {
      this.reason.disable({ emitEvent: false });
      this.message.disable({ emitEvent: false });
    } else {
      this.reason.enable({ emitEvent: false });
      this.message.enable({ emitEvent: false });
    }
  }
}
