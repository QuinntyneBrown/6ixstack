import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError, ContactSent, ContactTopic, SITE_API } from 'api';
import {
  Alert,
  Button,
  describedBy,
  ErrorSummary,
  FactItem,
  FieldErrorItem,
  FormField,
  Input,
  SuccessPanel,
} from 'components';
import { finalize } from 'rxjs';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FIELD_IDS: Record<string, string> = {
  name: 'contact-name',
  email: 'contact-email',
  topic: 'contact-topic',
  message: 'contact-message',
};

/** The contact page (`/contact`, L2-073): send the team a message; code of conduct reports reach their own inbox. */
@Component({
  selector: 'sx-contact-page',
  imports: [
    Alert,
    Button,
    ErrorSummary,
    FactItem,
    FormField,
    Input,
    ReactiveFormsModule,
    RouterLink,
    SuccessPanel,
  ],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly site = inject(SITE_API);
  private readonly injector = inject(Injector);
  private readonly summary = viewChild(ErrorSummary);

  protected readonly describedBy = describedBy;
  protected readonly topics: { value: ContactTopic; label: string }[] = [
    { value: 'general', label: 'General question' },
    { value: 'listing', label: 'Listing correction' },
    { value: 'partnership', label: 'Partnership or sponsorship' },
    { value: 'conduct', label: 'Code of conduct report' },
    { value: 'press', label: 'Press' },
  ];
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    topic: new FormControl<ContactTopic>('general', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });
  protected readonly errors = signal<FieldErrorItem[]>([]);
  protected readonly sending = signal(false);
  protected readonly failed = signal(false);
  protected readonly sent = signal<ContactSent | null>(null);

  constructor() {
    // Editing a field drops its error; the others stay until the next send (design: site/contact-form).
    const destroyRef = inject(DestroyRef);
    const controls: [string, AbstractControl][] = Object.entries(this.form.controls);
    for (const [field, control] of controls) {
      control.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
        const id = FIELD_IDS[field];
        if (this.errorFor(id)) this.errors.update((errors) => errors.filter((e) => e.controlId !== id));
      });
    }
  }

  protected errorFor(controlId: string): string | null {
    return this.errors().find((e) => e.controlId === controlId)?.message ?? null;
  }

  protected send(): void {
    if (this.sending()) return;
    const v = this.form.getRawValue();
    const errors: FieldErrorItem[] = [];
    if (!v.name.trim()) errors.push({ controlId: FIELD_IDS['name'], message: 'Enter your name.' });
    if (!EMAIL.test(v.email.trim()))
      errors.push({ controlId: FIELD_IDS['email'], message: 'Enter an email address like name@example.com' });
    if (!v.message.trim())
      errors.push({ controlId: FIELD_IDS['message'], message: 'Write a message so we know how to help' });
    if (errors.length) {
      this.showErrors(errors);
      return;
    }
    this.errors.set([]);
    this.failed.set(false);
    this.sending.set(true);
    this.site
      .contact({ name: v.name.trim(), email: v.email.trim(), topic: v.topic, message: v.message.trim() })
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (sent) => this.sent.set(sent),
        error: (error: unknown) => {
          if (error instanceof ApiError && error.kind === 'Validation') {
            this.showErrors(
              Object.entries(error.fieldErrors)
                .filter(([field]) => FIELD_IDS[field])
                .map(([field, messages]) => ({ controlId: FIELD_IDS[field], message: messages[0] })),
            );
          } else {
            this.failed.set(true);
          }
        },
      });
  }

  /** Send another message: an empty form, keeping who it is from. */
  protected another(): void {
    this.form.patchValue({ topic: 'general', message: '' });
    this.sent.set(null);
  }

  private showErrors(errors: FieldErrorItem[]): void {
    this.errors.set(errors);
    afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
  }
}
