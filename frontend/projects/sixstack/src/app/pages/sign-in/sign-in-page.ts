import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiError, AUTH_API } from 'api';
import { Alert, Button, describedBy, ErrorSummary, FormField, Input, SuccessPanel } from 'components';
import { finalize, map } from 'rxjs';
import { Countdown } from '../../shared/countdown';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LAST_EMAIL_KEY = 'sx.sign-in.email';

/** The sign-in page (`/sign-in`): request a magic link, see it was sent, recover from an expired one. */
@Component({
  selector: 'sx-sign-in-page',
  imports: [Alert, Button, ErrorSummary, FormField, Input, ReactiveFormsModule, RouterLink, SuccessPanel],
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  static readonly RESEND_SECONDS = 30;

  private readonly auth = inject(AUTH_API);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly summary = viewChild(ErrorSummary);
  private readonly emailInput = viewChild('emailInput', { read: ElementRef<HTMLInputElement> });

  protected readonly describedBy = describedBy;
  protected readonly email = new FormControl(readLastEmail(), { nonNullable: true });
  protected readonly expired = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('link') === 'expired')),
    {
      initialValue: false,
    },
  );
  protected readonly error = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly failed = signal<string | null>(null);
  protected readonly sentTo = signal<string | null>(null);
  protected readonly resendWait = new Countdown();

  constructor() {
    // The one field on the page takes focus on arrival (design: magic-link-sign-in).
    afterNextRender(() => this.emailInput()?.nativeElement.focus());
  }

  protected send(): void {
    const email = this.email.value.trim();
    if (!EMAIL.test(email)) {
      this.error.set('Enter an email address like name@example.com.');
      afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
      return;
    }
    this.error.set(null);
    this.request(email);
  }

  protected resend(): void {
    const email = this.sentTo();
    if (email) this.request(email);
  }

  protected useDifferentEmail(): void {
    this.sentTo.set(null);
    afterNextRender(() => this.emailInput()?.nativeElement.focus(), { injector: this.injector });
  }

  private request(email: string): void {
    this.sending.set(true);
    this.failed.set(null);
    this.auth
      .requestSignInLink(email, this.route.snapshot.queryParamMap.get('returnUrl'))
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          writeLastEmail(email);
          this.sentTo.set(email);
          this.resendWait.start(SignInPage.RESEND_SECONDS);
        },
        error: (error: unknown) =>
          this.failed.set(
            error instanceof ApiError && error.kind === 'RateLimited'
              ? 'You’ve asked for several links in a short time. Wait a few minutes, then try again.'
              : '6ixstack didn’t respond. Try again in a moment.',
          ),
      });
  }
}

function readLastEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeLastEmail(email: string): void {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email);
  } catch {
    // Storage blocked: no prefill after an expired link.
  }
}
