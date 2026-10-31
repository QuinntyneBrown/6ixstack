import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { Router, RouterLink } from '@angular/router';
import { ACCOUNT_API, AccountSettings, ApiError, SettingsSaved } from 'api';
import {
  Alert,
  Button,
  describedBy,
  ErrorSummary,
  FieldErrorItem,
  FormField,
  FormSection,
  Input,
  modalDialogConfig,
  SidebarNav,
  SidebarNavItem,
  Skeleton,
  Switch,
  ToastService,
} from 'components';
import {
  DELETE_ACCOUNT_TITLE_ID,
  DeleteAccountDialog,
  DeleteAccountDialogData,
} from '../../dialogs/delete-account/delete-account-dialog';
import { merge, startWith } from 'rxjs';
import { SessionStore } from '../../shell/session/session-store';
import { SKELETON_DELAY_MS } from '../../shared/load-state';

type Field = 'name' | 'email' | 'website';
const FIELDS: Field[] = ['name', 'email', 'website'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Settings (`/settings`): profile, email notifications and community (identity/account-settings). */
@Component({
  selector: 'sx-settings-page',
  imports: [
    Alert,
    Button,
    ErrorSummary,
    FormField,
    FormSection,
    Input,
    ReactiveFormsModule,
    RouterLink,
    SidebarNav,
    Skeleton,
    Switch,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly api = inject(ACCOUNT_API);
  private readonly injector = inject(Injector);
  private readonly summary = viewChild(ErrorSummary);
  protected readonly session = inject(SessionStore);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** Delete your organizer account? (L2-071): on success the app lands signed out on the events page. */
  protected openDelete(s: AccountSettings, trigger: EventTarget | null): void {
    const ref = this.dialog.open<boolean, DeleteAccountDialogData>(
      DeleteAccountDialog,
      modalDialogConfig({
        data: { email: s.email, notice: s.deletionNotice },
        ariaLabelledBy: DELETE_ACCOUNT_TITLE_ID,
        ariaDescribedBy: 'delete-account-description',
        restoreFocus: (trigger as HTMLElement | null) ?? true,
      }),
    );
    ref.closed.subscribe((deleted) => {
      if (!deleted) return;
      this.session.clear();
      void this.router.navigateByUrl('/');
      this.toasts.show({
        kind: 'info',
        title: 'Your account was deleted',
        text: 'Thanks for organizing with 6ixstack.',
      });
    });
  }

  protected readonly describedBy = describedBy;
  protected readonly sections: SidebarNavItem[] = [
    { label: 'Profile', fragment: 'profile' },
    { label: 'Email notifications', fragment: 'email-notifications' },
    { label: 'Community', fragment: 'community' },
    { label: 'Account', fragment: 'account' },
  ];
  protected readonly current = signal('profile');

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    website: new FormControl('', { nonNullable: true }),
    emailEventDecisions: new FormControl(true, { nonNullable: true }),
    emailProblemReports: new FormControl(true, { nonNullable: true }),
    emailWeeklySummary: new FormControl(false, { nonNullable: true }),
  });

  private readonly attempt = signal(0);
  protected readonly settings = signal<AccountSettings | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly slow = signal(false);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveFailed = signal(false);
  protected readonly saved = signal<SettingsSaved | null>(null);
  protected readonly serverErrors = signal<Partial<Record<Field, string>>>({});
  private readonly formValue = toSignal(
    merge(this.form.valueChanges, this.form.statusChanges).pipe(startWith(null)),
  );

  protected readonly errors = computed<FieldErrorItem[]>(() => {
    this.formValue();
    if (!this.submitted()) return [];
    const items: FieldErrorItem[] = [];
    for (const f of FIELDS) {
      const message = this.error(f);
      if (message) items.push({ controlId: f, message });
    }
    return items;
  });

  protected readonly savedText = computed(() => {
    const s = this.saved();
    if (!s) return '';
    const pending = s.pendingEmail
      ? ` We sent a confirmation link to ${s.pendingEmail}. You keep signing in with ${this.settings()?.email} until you use it.`
      : '';
    return `Saved at ${s.savedAtLabel}.${pending}`;
  });

  constructor() {
    effect((onCleanup) => {
      this.attempt();
      untracked(() => {
        this.loadFailed.set(false);
        this.settings.set(null);
        this.slow.set(false);
      });
      const timer = setTimeout(() => this.slow.set(true), SKELETON_DELAY_MS);
      const sub = this.api.settings().subscribe({
        next: (s) => {
          clearTimeout(timer);
          this.settings.set(s);
          this.form.reset({
            name: s.name,
            email: s.pendingEmail ?? s.email,
            website: s.website ?? '',
            emailEventDecisions: s.emailEventDecisions,
            emailProblemReports: s.emailProblemReports,
            emailWeeklySummary: s.emailWeeklySummary,
          });
        },
        error: () => {
          clearTimeout(timer);
          this.loadFailed.set(true);
        },
      });
      onCleanup(() => {
        clearTimeout(timer);
        sub.unsubscribe();
      });
    });
  }

  /** Each field's message: the form's own rules first, then the server's. */
  protected error(field: Field): string | null {
    this.formValue();
    if (!this.submitted()) return null;
    const v = this.form.getRawValue();
    if (field === 'name') {
      if (!v.name.trim()) return 'Enter your name.';
      if (v.name.trim().length > 100) return 'Keep your name to 100 characters or fewer.';
    }
    if (field === 'email' && !EMAIL.test(v.email.trim()))
      return 'Enter an email address like name@example.com.';
    if (field === 'website' && v.website.trim() && !isHttpsLink(v.website.trim())) {
      return 'Enter a full link like https://gtaazure.ca';
    }
    return this.serverErrors()[field] ?? null;
  }

  protected retry(): void {
    this.attempt.update((n) => n + 1);
  }

  protected save(): void {
    if (this.saving()) return;
    this.submitted.set(true);
    this.serverErrors.set({});
    this.saveFailed.set(false);
    this.saved.set(null);
    if (this.errors().length) {
      afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.form.disable({ emitEvent: false });
    this.api
      .save({
        name: v.name.trim(),
        email: v.email.trim(),
        website: v.website.trim() || null,
        emailEventDecisions: v.emailEventDecisions,
        emailProblemReports: v.emailProblemReports,
        emailWeeklySummary: v.emailWeeklySummary,
      })
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.form.enable({ emitEvent: false });
          this.submitted.set(false);
          this.saved.set(saved);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.form.enable({ emitEvent: false });
          if (error instanceof ApiError && error.kind === 'Validation') {
            const server: Partial<Record<Field, string>> = {};
            for (const f of FIELDS) {
              const m = error.fieldErrors[f]?.[0];
              if (m) server[f] = m;
            }
            this.serverErrors.set(server);
            afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
          } else {
            this.saveFailed.set(true);
          }
        },
      });
  }
}

function isHttpsLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}
