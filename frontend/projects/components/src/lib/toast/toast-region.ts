import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast } from './toast';
import { ActiveToast, ToastService } from './toast.service';

/**
 * The fixed region that shows toasts. Render it once in the app shell; it is present from start-up so screen
 * readers register the polite live region before the first toast arrives.
 */
@Component({
  selector: 'sx-toast-region',
  imports: [Toast],
  template: `
    <div class="toast-region" role="status" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <sx-toast
          [toast]="toast"
          (dismissed)="service.dismiss(toast.id)"
          (actioned)="act(toast)"
          (paused)="service.pause(toast.id)"
          (resumed)="service.resume(toast.id)"
        />
      }
    </div>
  `,
  styleUrl: './toast-region.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegion {
  protected readonly service = inject(ToastService);
  protected readonly toasts = this.service.toasts;

  protected act(toast: ActiveToast): void {
    toast.action?.run();
    this.service.dismiss(toast.id);
  }
}
