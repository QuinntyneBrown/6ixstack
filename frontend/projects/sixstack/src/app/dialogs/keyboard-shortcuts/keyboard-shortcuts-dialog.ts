import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button, DialogShell } from 'components';

export const KEYBOARD_SHORTCUTS_TITLE_ID = 'sx-keyboard-shortcuts-title';

/** The review queue's keyboard shortcuts, opened with ? (dialogs/keyboard-shortcuts). */
@Component({
  selector: 'sx-keyboard-shortcuts-dialog',
  imports: [Button, DialogShell],
  template: `
    <sx-dialog-shell title="Keyboard shortcuts" size="sm" [titleId]="titleId">
      <dl class="dl">
        @for (row of shortcuts; track row.key) {
          <dt>
            <kbd>{{ row.key }}</kbd>
          </dt>
          <dd>{{ row.action }}</dd>
        }
      </dl>
      <p class="text-caption">Shortcuts don’t fire while you type in a field.</p>
      <button slot="footer" sx-button type="button" cdkFocusInitial (click)="close()">Close</button>
    </sx-dialog-shell>
  `,
  styles: `
    .dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--spacingHorizontalS) var(--spacingHorizontalXXL);
      margin: 0;
    }
    dd {
      margin: 0;
    }
    kbd {
      font: var(--sx-text-code);
      background: var(--colorNeutralBackground1);
      border: 1px solid var(--colorNeutralStroke1);
      border-bottom-width: 2px;
      border-radius: var(--borderRadiusSmall);
      padding: 0.05em 0.4em;
    }
    .text-caption {
      margin-top: var(--spacingHorizontalL);
      font: var(--sx-text-caption);
      color: var(--colorNeutralForeground2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardShortcutsDialog {
  private readonly ref = inject(DialogRef);
  protected readonly titleId = KEYBOARD_SHORTCUTS_TITLE_ID;

  protected readonly shortcuts = [
    { key: 'J', action: 'Next submission' },
    { key: 'K', action: 'Previous submission' },
    { key: 'A', action: 'Approve the focused submission' },
    // R (reject) joins this list with journey 08.
    { key: '?', action: 'Show these shortcuts' },
  ];

  protected close(): void {
    this.ref.close();
  }
}
