import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError, REFERENCE_DATA_API, ReferenceData, SUBMISSIONS_API, SubmissionReceived } from 'api';
import {
  Alert,
  Button,
  Check,
  Choice,
  describedBy,
  ErrorSummary,
  FieldErrorItem,
  FieldSet,
  FormField,
  FormSection,
  Input,
  isTopic,
  NextSteps,
  Skeleton,
  SuccessPanel,
  TopicKey,
  TopicTag,
} from 'components';
import { catchError, debounceTime, finalize, map, merge, of, startWith, switchMap, timer } from 'rxjs';
import { DraftStore } from '../../shared/draft-store';
import {
  applyFormat,
  createEventForm,
  FIELD_ORDER,
  FieldName,
  fieldError,
  toSubmission,
} from '../../shared/event-form/event-form';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';

/** The submit page (`/submit`): the event form, its states and the success panel (submissions/submit-event). */
@Component({
  selector: 'sx-submit-event-page',
  imports: [
    Alert,
    Button,
    Check,
    Choice,
    ErrorSummary,
    FieldSet,
    FormField,
    FormSection,
    Input,
    NextSteps,
    ReactiveFormsModule,
    RouterLink,
    Skeleton,
    SuccessPanel,
    TopicTag,
  ],
  templateUrl: './submit-event-page.html',
  styleUrl: './submit-event-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitEventPage {
  private readonly referenceApi = inject(REFERENCE_DATA_API);
  private readonly submissions = inject(SUBMISSIONS_API);
  private readonly summary = viewChild(ErrorSummary);
  private readonly injector = inject(Injector);
  private readonly drafts = inject(DraftStore);

  protected readonly form = createEventForm();
  protected readonly describedBy = describedBy;
  protected readonly nextSteps = [
    'A moderator checks the details, usually within a day.',
    'We email you when it’s live, or what to fix if something is missing.',
    'It appears in the list, the calendar and every matching feed.',
  ];

  private readonly reload = signal(0);
  protected readonly reference = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        this.referenceApi.get().pipe(
          map((data): LoadState<ReferenceData> => loaded(data)),
          catchError((error: unknown) => of(failed<ReferenceData>(error))),
        ),
      ),
    ),
    { initialValue: loading<ReferenceData>() },
  );
  /** True once reference data has taken longer than 300 ms (DelayedSkeleton, L2-045). */
  protected readonly slow = toSignal(timer(SKELETON_DELAY_MS).pipe(map(() => true)), { initialValue: false });

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitFailed = signal(false);
  protected readonly received = signal<SubmissionReceived | null>(null);
  protected readonly serverErrors = signal<Partial<Record<FieldName, string>>>({});
  private readonly formValue = toSignal(
    merge(this.form.valueChanges, this.form.statusChanges).pipe(startWith(null)),
  );

  protected readonly errors = computed<FieldErrorItem[]>(() => {
    this.formValue();
    if (!this.submitted()) return [];
    const server = this.serverErrors();
    return FIELD_ORDER.map((name) => ({ name, message: fieldError(this.form, name, server) }))
      .filter((e): e is { name: FieldName; message: string } => !!e.message)
      .map((e) => ({ controlId: e.name, message: e.message }));
  });

  static readonly DRAFT_KEY = 'sx.draft.submit-event';

  constructor() {
    const draft = this.drafts.read<ReturnType<typeof this.form.getRawValue>>(SubmitEventPage.DRAFT_KEY);
    if (draft) this.form.patchValue(draft, { emitEvent: false });
    applyFormat(this.form);
    this.form.valueChanges.pipe(debounceTime(500), takeUntilDestroyed()).subscribe(() => {
      if (!this.received()) this.drafts.write(SubmitEventPage.DRAFT_KEY, this.form.getRawValue());
    });
    merge(this.form.controls.format.valueChanges, this.form.controls.price.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => applyFormat(this.form));
  }

  protected topics(data: ReferenceData): TopicKey[] {
    return data.topics.map((t) => t.key).filter(isTopic);
  }

  protected error(name: FieldName): string | null {
    this.formValue();
    return this.submitted() ? fieldError(this.form, name, this.serverErrors()) : null;
  }

  protected isTopicChecked(topic: string): boolean {
    return this.form.controls.topics.value.includes(topic);
  }

  protected toggleTopic(topic: string, checked: boolean): void {
    const current = this.form.controls.topics.value;
    this.form.controls.topics.setValue(checked ? [...current, topic] : current.filter((t) => t !== topic));
  }

  protected retryReference(): void {
    this.reload.update((n) => n + 1);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.serverErrors.set({});
    this.submitFailed.set(false);
    if (this.errors().length) {
      this.focusSummary();
      return;
    }
    this.submitting.set(true);
    this.form.disable({ emitEvent: false });
    this.submissions
      .submit(toSubmission(this.form))
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.form.enable({ emitEvent: false });
          applyFormat(this.form);
        }),
      )
      .subscribe({
        next: (received) => {
          this.drafts.clear(SubmitEventPage.DRAFT_KEY);
          this.received.set(received);
        },
        error: (error: unknown) => {
          if (error instanceof ApiError && error.kind === 'Validation') {
            const server: Partial<Record<FieldName, string>> = {};
            for (const [key, messages] of Object.entries(error.fieldErrors)) {
              if ((FIELD_ORDER as readonly string[]).includes(key)) server[key as FieldName] = messages[0];
            }
            this.serverErrors.set(server);
            this.focusSummary();
          } else {
            this.submitFailed.set(true);
          }
        },
      });
  }

  /** Moves focus to the error summary once it has rendered, so screen readers announce it. */
  private focusSummary(): void {
    afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
  }

  protected submitAnother(): void {
    this.received.set(null);
    this.submitted.set(false);
    this.form.reset();
    applyFormat(this.form);
  }
}
