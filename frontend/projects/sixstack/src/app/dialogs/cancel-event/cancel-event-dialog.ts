import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiError, EventCancelled, ORGANIZER_EVENTS_API } from 'api';
import { Alert, Button, Check, Choice, describedBy, DialogShell, FormField, Input } from 'components';
import { startWith } from 'rxjs';

export const CANCEL_EVENT_TITLE_ID = 'sx-cancel-event-title';

/** Paid events and events with this many going need the name typed (L2-056). */
const HIGH_IMPACT_GOING = 100;

export interface CancelEventDialogData {
  eventId: string;
  title: string;
  isPaid: boolean;
  goingCount: number;
  emailableAttendees: number;
  /** Called when the cancellation succeeds, even if the dialog was closed while it ran. */
  cancelled: (result: EventCancelled) => void;
}

/** Cancel “{title}”? (dialogs/cancel-event, L2-056): a required reason, the email option and typed confirmation. */
@Component({
  selector: 'sx-cancel-event-dialog',
  imports: [Alert, Button, Check, Choice, DialogShell, FormField, Input, ReactiveFormsModule],
  templateUrl: './cancel-event-dialog.html',
  styles: `
    .cancel-body {
      display: grid;
      gap: var(--spacingHorizontalXL);
    }
    .cancel-failure {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelEventDialog {
  private readonly ref = inject<DialogRef<EventCancelled>>(DialogRef);
  private readonly api = inject(ORGANIZER_EVENTS_API);
  private readonly injector = inject(Injector);
  protected readonly data = inject<CancelEventDialogData>(DIALOG_DATA);

  protected readonly titleId = CANCEL_EVENT_TITLE_ID;
  protected readonly describedBy = describedBy;
  protected readonly reason = new FormControl('', { nonNullable: true });
  protected readonly notify = new FormControl(true, { nonNullable: true });
  protected readonly confirmName = new FormControl('', { nonNullable: true });
  protected readonly reasonError = signal<string | null>(null);
  protected readonly confirmError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected readonly canEmail = this.data.emailableAttendees > 0;
  protected readonly needsName = this.data.isPaid || this.data.goingCount >= HIGH_IMPACT_GOING;
  private readonly typed = toSignal(this.confirmName.valueChanges.pipe(startWith('')), { initialValue: '' });
  /** Cancel event stays disabled until the typed name matches, ignoring case (cancel-event/confirm). */
  protected readonly nameMatches = computed(
    () => !this.needsName || this.typed().trim().toLowerCase() === this.data.title.toLowerCase(),
  );

  protected submit(): void {
    const reason = this.reason.value.trim();
    if (!reason) {
      this.reasonError.set('Tell attendees why, in a sentence or two.');
      afterNextRender(() => document.getElementById('cancel-reason')?.focus(), { injector: this.injector });
      return;
    }
    this.reasonError.set(null);
    this.confirmError.set(null);
    this.failed.set(false);
    this.setBusy(true);
    this.api
      .cancelEvent(this.data.eventId, {
        reason,
        notifyAttendees: this.canEmail && this.notify.value,
        confirmationName: this.needsName ? this.confirmName.value.trim() : null,
      })
      .subscribe({
        next: (result) => {
          this.data.cancelled(result);
          this.ref.close(result);
        },
        error: (error: unknown) => {
          this.setBusy(false);
          if (error instanceof ApiError && error.kind === 'Validation') {
            this.reasonError.set(error.fieldErrors['reason']?.[0] ?? null);
            this.confirmError.set(error.fieldErrors['confirmationName']?.[0] ?? null);
          } else {
            this.failed.set(true);
          }
        },
      });
  }

  /** Keep event stays available while cancelling; the request still finishes and reports through the opener. */
  protected keep(): void {
    this.ref.close();
  }

  private setBusy(busy: boolean): void {
    this.busy.set(busy);
    for (const control of [this.reason, this.notify, this.confirmName]) {
      if (busy) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }
}
