import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ACCOUNT_API, ApiError } from 'api';
import { Alert, Button, describedBy, DialogShell, FormField, Input } from 'components';
import { startWith } from 'rxjs';

export const DELETE_ACCOUNT_TITLE_ID = 'sx-delete-account-title';

export interface DeleteAccountDialogData {
  email: string;
  notice: string;
}

/**
 * Delete your organizer account? (dialogs/delete-account, L2-071): the typed email enables Delete account; while
 * deleting the dialog cannot be dismissed. Closes with `true` once the account is gone.
 */
@Component({
  selector: 'sx-delete-account-dialog',
  imports: [Alert, Button, DialogShell, FormField, Input, ReactiveFormsModule],
  template: `
    <sx-dialog-shell
      title="Delete your organizer account?"
      [titleId]="titleId"
      tone="danger"
      [closable]="!busy()"
    >
      <p slot="description" id="delete-account-description">{{ data.notice }}</p>
      <div class="delete-body">
        @if (failed()) {
          <sx-alert class="delete-failure" kind="danger" announce="alert" title="Your account wasn’t deleted">
            Nothing changed. Try again, or <a href="mailto:hello@6ixstack.dev">contact us</a> and we’ll do it
            for you.
          </sx-alert>
        }
        <sx-form-field
          [label]="'Type your email, ' + data.email + ', to confirm'"
          controlId="delete-email"
          [error]="mismatch()"
        >
          <input
            sx-input
            id="delete-email"
            type="email"
            autocomplete="off"
            [formControl]="email"
            [attr.aria-invalid]="mismatch() ? 'true' : null"
            [attr.aria-describedby]="describedBy('delete-email', false, !!mismatch())"
            (blur)="check()"
            (keydown.enter)="check()"
          />
        </sx-form-field>
      </div>
      <button slot="footer" sx-button type="button" cdkFocusInitial [disabled]="busy()" (click)="keep()">
        Keep account
      </button>
      <button
        slot="footer"
        sx-button
        appearance="danger"
        type="button"
        [busy]="busy()"
        [disabled]="!matches()"
        (click)="delete()"
      >
        {{ busy() ? 'Deleting…' : failed() ? 'Try again' : 'Delete account' }}
      </button>
    </sx-dialog-shell>
  `,
  styles: `
    .delete-body {
      display: grid;
      gap: var(--spacingHorizontalXL);
    }
    .delete-failure {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountDialog {
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(ACCOUNT_API);
  protected readonly data = inject<DeleteAccountDialogData>(DIALOG_DATA);

  protected readonly titleId = DELETE_ACCOUNT_TITLE_ID;
  protected readonly describedBy = describedBy;
  protected readonly email = new FormControl('', { nonNullable: true });
  private readonly typed = toSignal(this.email.valueChanges.pipe(startWith('')), { initialValue: '' });
  /** Matches ignoring case and surrounding spaces (L2-071). */
  protected readonly matches = computed(
    () => this.typed().trim().toLowerCase() === this.data.email.toLowerCase(),
  );
  protected readonly mismatch = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  /** On blur or Enter, a wrong address says what to type. */
  protected check(): void {
    this.mismatch.set(
      this.typed().trim() && !this.matches() ? `That doesn’t match. Type ${this.data.email} exactly.` : null,
    );
  }

  protected keep(): void {
    this.ref.close(false);
  }

  protected delete(): void {
    if (!this.matches() || this.busy()) return;
    this.mismatch.set(null);
    this.failed.set(false);
    this.busy.set(true);
    this.ref.disableClose = true;
    this.email.disable({ emitEvent: false });
    this.api.delete(this.email.value.trim()).subscribe({
      next: () => this.ref.close(true),
      error: (error: unknown) => {
        this.busy.set(false);
        this.ref.disableClose = false;
        this.email.enable({ emitEvent: false });
        if (error instanceof ApiError && error.kind === 'Validation') {
          this.mismatch.set(error.fieldErrors['confirmationEmail']?.[0] ?? null);
        } else {
          this.failed.set(true);
        }
      },
    });
  }
}
