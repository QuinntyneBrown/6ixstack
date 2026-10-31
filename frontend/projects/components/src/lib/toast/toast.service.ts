import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type ToastKind = 'info' | 'success' | 'warning' | 'danger';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastOptions {
  kind: ToastKind;
  title: string;
  text?: string;
  action?: ToastAction;
}

/** Handle to a shown toast, e.g. for an Undo flow that needs to know when it went away. */
export interface ToastRef {
  dismiss(): void;
  readonly afterDismissed: Observable<void>;
}

/** A toast in the region, with its countdown state. */
export interface ActiveToast extends ToastOptions {
  id: number;
  /** Milliseconds left before auto-dismiss; `null` for danger toasts, which stay until dismissed. */
  remainingMs: number | null;
  paused: boolean;
}

interface Countdown {
  timer?: ReturnType<typeof setTimeout>;
  startedAt: number;
  dismissed: Subject<void>;
}

/**
 * Shows toasts (L2-074): at most three, newest last; non-danger toasts dismiss after 8 s, pausing while
 * hovered or focused and resuming from the time left; danger toasts stay until dismissed.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  static readonly DURATION_MS = 8_000;
  static readonly MAX_VISIBLE = 3;

  private nextId = 1;
  private readonly countdowns = new Map<number, Countdown>();
  private readonly state = signal<ActiveToast[]>([]);

  readonly toasts = this.state.asReadonly();

  show(options: ToastOptions): ToastRef {
    const toast: ActiveToast = {
      ...options,
      id: this.nextId++,
      remainingMs: options.kind === 'danger' ? null : ToastService.DURATION_MS,
      paused: false,
    };
    const dismissed = new Subject<void>();
    this.countdowns.set(toast.id, { startedAt: Date.now(), dismissed });

    const current = this.state();
    if (current.length >= ToastService.MAX_VISIBLE) {
      this.dismiss(current[0].id);
    }
    this.state.update((list) => [...list, toast]);
    this.startTimer(toast);

    return {
      dismiss: () => this.dismiss(toast.id),
      afterDismissed: dismissed.asObservable(),
    };
  }

  dismiss(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) {
      return;
    }
    clearTimeout(countdown.timer);
    this.countdowns.delete(id);
    this.state.update((list) => list.filter((t) => t.id !== id));
    countdown.dismissed.next();
    countdown.dismissed.complete();
  }

  /** Stops the countdown while the pointer is over the toast or focus is inside it. */
  pause(id: number): void {
    const toast = this.find(id);
    const countdown = this.countdowns.get(id);
    if (!toast || !countdown || toast.remainingMs === null || toast.paused) {
      return;
    }
    clearTimeout(countdown.timer);
    const remainingMs = Math.max(0, toast.remainingMs - (Date.now() - countdown.startedAt));
    this.patch(id, { remainingMs, paused: true });
  }

  /** Continues the countdown from the time left. */
  resume(id: number): void {
    const toast = this.find(id);
    if (!toast || toast.remainingMs === null || !toast.paused) {
      return;
    }
    this.patch(id, { paused: false });
    this.startTimer({ ...toast, paused: false });
  }

  private startTimer(toast: ActiveToast): void {
    const countdown = this.countdowns.get(toast.id);
    if (!countdown || toast.remainingMs === null) {
      return;
    }
    countdown.startedAt = Date.now();
    countdown.timer = setTimeout(() => this.dismiss(toast.id), toast.remainingMs);
  }

  private find(id: number): ActiveToast | undefined {
    return this.state().find((t) => t.id === id);
  }

  private patch(id: number, changes: Partial<ActiveToast>): void {
    this.state.update((list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }
}
