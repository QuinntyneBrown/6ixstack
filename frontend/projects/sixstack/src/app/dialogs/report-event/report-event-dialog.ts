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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiError, EVENTS_API, ReportReason } from 'api';
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

export const REPORT_EVENT_TITLE_ID = 'sx-report-event-title';

export interface ReportEventDialogData {
  slug: string;
  title: string;
  communityName: string;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'wrongDetails', label: 'Wrong date, time or venue' },
  { value: 'cancelled', label: 'The event is cancelled' },
  { value: 'brokenLink', label: 'Ticket or stream link is broken' },
  { value: 'spam', label: 'Spam or not a dev event' },
  { value: 'codeOfConduct', label: 'Code of conduct concern' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Report a problem (dialogs/report-event, L2-039): a reason, optional details and reply email; busy, failed and sent states. */
@Component({
  selector: 'sx-report-event-dialog',
  imports: [Alert, Button, Check, Choice, DialogShell, FieldSet, FormField, Input, ReactiveFormsModule],
  templateUrl: './report-event-dialog.html',
  styles: `
    .report-body {
      display: grid;
      gap: var(--spacingHorizontalXL);
    }
    .reasons {
      display: grid;
    }
    .report-failure {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportEventDialog {
  private readonly ref = inject(DialogRef);
  private readonly api = inject(EVENTS_API);
  private readonly injector = inject(Injector);
  private readonly back = viewChild('back', { read: ElementRef<HTMLButtonElement> });
  protected readonly data = inject<ReportEventDialogData>(DIALOG_DATA);

  protected readonly titleId = REPORT_EVENT_TITLE_ID;
  protected readonly reasons = REASONS;
  protected readonly describedBy = describedBy;
  protected readonly reason = new FormControl<ReportReason | null>(null);
  protected readonly details = new FormControl('', { nonNullable: true });
  protected readonly email = new FormControl('', { nonNullable: true });
  protected readonly reasonError = signal<string | null>(null);
  protected readonly emailError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly sent = signal(false);

  protected submit(): void {
    const reason = this.reason.value;
    const email = this.email.value.trim();
    this.reasonError.set(reason ? null : 'Choose what is wrong so we can route it to the right person.');
    this.emailError.set(email && !EMAIL.test(email) ? 'Enter an email address like name@example.com.' : null);
    if (!reason) {
      this.focus('report-reason-0');
      return;
    }
    if (this.emailError()) {
      this.focus('report-email');
      return;
    }
    this.failed.set(false);
    this.setBusy(true);
    this.api
      .report(this.data.slug, {
        reason,
        details: this.details.value.trim() || null,
        replyEmail: email || null,
      })
      .subscribe({
        next: () => {
          this.setBusy(false);
          this.sent.set(true);
          afterNextRender(() => this.back()?.nativeElement.focus(), { injector: this.injector });
        },
        error: (error: unknown) => {
          this.setBusy(false);
          if (error instanceof ApiError && error.kind === 'Validation' && error.fieldErrors['replyEmail']) {
            this.emailError.set(error.fieldErrors['replyEmail'][0]);
            return;
          }
          this.failed.set(true);
        },
      });
  }

  /** Cancel stays available while sending (L2-039 criterion 2). */
  protected close(): void {
    this.ref.close();
  }

  private focus(id: string): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }

  private setBusy(busy: boolean): void {
    this.busy.set(busy);
    for (const control of [this.reason, this.details, this.email]) {
      if (busy) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }
}
