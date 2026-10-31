import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AUTH_API } from 'api';
import { Button, DialogShell, ToastService } from 'components';

export const SIGN_OUT_TITLE_ID = 'sx-sign-out-title';

/**
 * Sign out of 6ixstack? (dialogs/sign-out, L2-049): Stay signed in has focus; while signing out both buttons are
 * disabled and the dialog cannot be dismissed. Closes with `true` once this device is signed out.
 */
@Component({
  selector: 'sx-sign-out-dialog',
  imports: [Button, DialogShell],
  template: `
    <sx-dialog-shell title="Sign out of 6ixstack?" [titleId]="titleId" size="sm" [closable]="!busy()">
      <p slot="description" id="sign-out-description">
        You’ll need a new email link to sign back in. Other devices stay signed in.
      </p>
      <button slot="footer" sx-button type="button" cdkFocusInitial [disabled]="busy()" (click)="stay()">
        Stay signed in
      </button>
      <button slot="footer" sx-button appearance="primary" type="button" [busy]="busy()" (click)="signOut()">
        {{ busy() ? 'Signing out…' : 'Sign out' }}
      </button>
    </sx-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignOutDialog {
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly auth = inject(AUTH_API);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = SIGN_OUT_TITLE_ID;
  protected readonly busy = signal(false);

  protected stay(): void {
    this.ref.close(false);
  }

  protected signOut(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.ref.disableClose = true;
    this.auth.signOut().subscribe({
      next: () => this.ref.close(true),
      error: () => {
        this.busy.set(false);
        this.ref.disableClose = false;
        this.toasts.show({
          kind: 'danger',
          title: 'Couldn’t sign out',
          text: 'You’re still signed in. Try again.',
        });
      },
    });
  }
}
