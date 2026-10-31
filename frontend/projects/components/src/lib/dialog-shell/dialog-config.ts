import { DialogConfig } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDialogConfig = DialogConfig<any, any>;

/** CDK Dialog settings for a centred modal with the 6ixstack backdrop. */
export function modalDialogConfig<C extends AnyDialogConfig>(overrides: C = {} as C): C {
  return {
    backdropClass: 'sx-dialog-backdrop',
    panelClass: 'sx-dialog-pane',
    width: 'calc(100vw - 3rem)',
    maxWidth: '32rem',
    ...overrides,
  };
}

/** CDK Dialog settings for a bottom sheet: docked to the bottom edge and full width on phones. */
export function sheetDialogConfig<C extends AnyDialogConfig>(overlay: Overlay, overrides: C = {} as C): C {
  return {
    backdropClass: 'sx-dialog-backdrop',
    panelClass: ['sx-dialog-pane', 'sx-dialog-pane--sheet'],
    positionStrategy: overlay.position().global().centerHorizontally().bottom('0'),
    width: '100%',
    maxWidth: '32rem',
    ...overrides,
  };
}
