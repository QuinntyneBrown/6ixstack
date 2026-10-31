import { OverlayContainer } from '@angular/cdk/overlay';
import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { Toast } from './toast';
import { ActiveToast, ToastService } from './toast.service';

/**
 * The fixed region that shows toasts. Render it once in the app shell; it is present from start-up so screen
 * readers register the polite live region before the first toast arrives. It moves itself into the CDK overlay
 * container, so an open dialog, which hides everything outside that container from assistive technology, never
 * hides a toast or its action (L2-074).
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

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const overlays = inject(OverlayContainer);
    afterNextRender(() => overlays.getContainerElement().appendChild(host));
  }

  protected act(toast: ActiveToast): void {
    toast.action?.run();
    this.service.dismiss(toast.id);
  }
}
