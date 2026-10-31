import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button, DialogShell } from 'components';

export const SENT_EMAIL_TITLE_ID = 'sx-sent-email-title';

export interface SentEmailDialogData {
  to: string;
  subject: string;
  body: string;
}

/** The email exactly as sent, opened by View email (dialogs/sent-email). */
@Component({
  selector: 'sx-sent-email-dialog',
  imports: [Button, DialogShell],
  template: `
    <sx-dialog-shell [title]="data.subject" [titleId]="titleId">
      <p slot="description" class="sent-email__to">To {{ data.to }}</p>
      <pre class="sent-email__body">{{ data.body }}</pre>
      <button slot="footer" sx-button type="button" cdkFocusInitial (click)="close()">Close</button>
    </sx-dialog-shell>
  `,
  styles: `
    .sent-email__to {
      color: var(--colorNeutralForeground2);
    }
    .sent-email__body {
      white-space: pre-wrap;
      margin: 0;
      padding: var(--spacingHorizontalL);
      font: var(--sx-text-body-sm);
      border: 1px solid var(--colorNeutralStroke2);
      border-radius: var(--borderRadiusMedium);
      background: var(--colorSubtleBackgroundHover);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SentEmailDialog {
  private readonly ref = inject(DialogRef);
  protected readonly data = inject<SentEmailDialogData>(DIALOG_DATA);
  protected readonly titleId = SENT_EMAIL_TITLE_ID;

  protected close(): void {
    this.ref.close();
  }
}
