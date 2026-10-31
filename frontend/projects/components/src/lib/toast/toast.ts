import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { ActiveToast, ToastKind } from './toast.service';

export const KIND_ICONS: Record<ToastKind, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'alert',
};

/** One toast: icon, title, optional text and action, Dismiss, and the countdown bar (none for danger). */
@Component({
  selector: 'sx-toast',
  imports: [Icon],
  template: `
    <div
      class="toast"
      [class]="'toast toast--' + toast().kind"
      [attr.role]="toast().kind === 'danger' ? 'alert' : null"
      (mouseenter)="paused.emit()"
      (mouseleave)="resumed.emit()"
      (focusin)="paused.emit()"
      (focusout)="onFocusOut($event)"
    >
      <sx-icon [name]="icon()" />
      <div class="toast__body">
        <div class="toast__title">{{ toast().title }}</div>
        @if (toast().text) {
          <div class="toast__text">{{ toast().text }}</div>
        }
        @if (toast().action; as action) {
          <button class="toast__action" type="button" (click)="actioned.emit()">{{ action.label }}</button>
        }
      </div>
      <button class="close" type="button" aria-label="Dismiss" (click)="dismissed.emit()">
        <sx-icon name="x" size="sm" />
      </button>
      @if (toast().remainingMs !== null) {
        <span
          class="toast__progress"
          aria-hidden="true"
          [style.animation-duration.ms]="duration"
          [class.toast__progress--paused]="toast().paused"
        ></span>
      }
    </div>
  `,
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  readonly toast = input.required<ActiveToast>();
  readonly duration = 8_000;

  readonly dismissed = output<void>();
  readonly actioned = output<void>();
  readonly paused = output<void>();
  readonly resumed = output<void>();

  protected readonly icon = computed(() => KIND_ICONS[this.toast().kind]);

  protected onFocusOut(event: FocusEvent): void {
    const toast = event.currentTarget as HTMLElement;
    if (!toast.contains(event.relatedTarget as Node | null)) {
      this.resumed.emit();
    }
  }
}
