import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '../../../src/lib/button/button';
import { ToastRegion } from '../../../src/lib/toast/toast-region';
import { ToastKind, ToastOptions, ToastService } from '../../../src/lib/toast/toast.service';

const SAMPLES: Record<ToastKind, ToastOptions> = {
  success: {
    kind: 'success',
    title: 'Added to Google Calendar',
    text: 'Azure Data & AI Day GTA, Thu Nov 5.',
  },
  info: {
    kind: 'info',
    title: 'Filters cleared',
    text: 'Showing all 14 events.',
    action: { label: 'Undo', run: () => undefined },
  },
  warning: {
    kind: 'warning',
    title: 'Link checks are slow',
    text: 'Your event is saved; checks finish shortly.',
  },
  danger: {
    kind: 'danger',
    title: "Couldn't copy the link",
    text: 'Select the link and copy it manually.',
    action: { label: 'Try again', run: () => undefined },
  },
};

/** Story-only host that raises sample toasts through ToastService. */
@Component({
  selector: 'sx-toast-playground',
  imports: [Button, ToastRegion],
  template: `
    <div class="cluster">
      @for (kind of kinds; track kind) {
        <button sx-button type="button" (click)="show(kind)">Show {{ kind }}</button>
      }
    </div>
    <sx-toast-region />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPlayground {
  private readonly toasts = inject(ToastService);
  protected readonly kinds: ToastKind[] = ['info', 'success', 'warning', 'danger'];

  protected show(kind: ToastKind): void {
    this.toasts.show(SAMPLES[kind]);
  }
}
