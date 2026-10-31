import { DestroyRef, inject, signal } from '@angular/core';

/** Seconds left before an action may run again, ticking each second (the resend wait on sign-in, L2-046). */
export class Countdown {
  private readonly remainingSeconds = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;
  readonly remaining = this.remainingSeconds.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  start(seconds: number): void {
    this.stop();
    this.remainingSeconds.set(seconds);
    this.timer = setInterval(() => {
      this.remainingSeconds.update((s) => s - 1);
      if (this.remainingSeconds() <= 0) this.stop();
    }, 1000);
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
