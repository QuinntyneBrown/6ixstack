import { DialogRef } from '@angular/cdk/dialog';
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * The surface of every dialog opened with Angular CDK `Dialog`: header with title and Close, body, and an
 * optional sticky footer (`[slot=footer]`). Pass the same `titleId` to the dialog config's `ariaLabelledBy`.
 * `variant="sheet"` docks it to the bottom edge on phones (the mobile menu).
 */
@Component({
  selector: 'sx-dialog-shell',
  imports: [Button, Icon],
  template: `
    <div
      class="dialog__panel"
      [class.dialog__panel--sheet]="variant() === 'sheet'"
      [class]="'dialog__panel--' + size()"
    >
      <div class="dialog__header">
        @if (tone() === 'danger') {
          <div class="dialog__icon dialog__icon--danger" aria-hidden="true"><sx-icon name="warning" /></div>
        }
        <div class="dialog__heading">
          <h2 class="dialog__title" [id]="titleId()">{{ title() }}</h2>
          <ng-content select="[slot=description]" />
        </div>
        @if (closable()) {
          <button sx-button appearance="ghost" iconOnly type="button" aria-label="Close" (click)="close()">
            <sx-icon name="x" />
          </button>
        }
      </div>
      <div class="dialog__body"><ng-content /></div>
      <div class="dialog__footer"><ng-content select="[slot=footer]" /></div>
    </div>
  `,
  styleUrl: './dialog-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShell {
  private readonly dialogRef = inject(DialogRef, { optional: true });

  readonly title = input.required<string>();
  readonly titleId = input(`sx-dialog-title-${nextId++}`);
  readonly variant = input<'modal' | 'sheet'>('modal');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closable = input(true, { transform: booleanAttribute });
  /** `danger` adds the warning icon for destructive confirmations, such as cancelling an event. */
  readonly tone = input<'default' | 'danger'>('default');

  close(): void {
    this.dialogRef?.close();
  }
}
