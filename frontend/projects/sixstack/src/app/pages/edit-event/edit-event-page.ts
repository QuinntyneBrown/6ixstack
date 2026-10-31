import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ApiError,
  EventDetailsForm,
  EventEdit,
  EventSaved,
  ORGANIZER_EVENTS_API,
  REFERENCE_DATA_API,
  ReferenceData,
} from 'api';
import {
  Alert,
  AlertAction,
  BackLink,
  Button,
  EmptyState,
  ErrorSummary,
  FieldErrorItem,
  Icon,
  InlineStatus,
  InlineStatusKind,
  Skeleton,
  StatusPage,
  ToastService,
} from 'components';
import { finalize, forkJoin, map, merge, startWith, timer } from 'rxjs';
import { CancelEventLauncher } from '../../shared/cancel/cancel-event-launcher';
import { DraftStore, SUBMIT_DRAFT_KEY } from '../../shared/draft-store';
import {
  applyFormat,
  createEventForm,
  EventForm,
  FIELD_ORDER,
  FieldName,
  fieldError,
  toSubmission,
} from '../../shared/event-form/event-form';
import { EventFormFields } from '../../shared/event-form/event-form-fields';
import { SKELETON_DELAY_MS } from '../../shared/load-state';
import { SessionStore } from '../../shell/session/session-store';

const CONTACT = 'mailto:hello@6ixstack.dev';

interface Forbidden {
  communityName: string;
  eventTitle: string;
  signedInEmail: string;
  signedInCommunity: string | null;
}

type PageState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'forbidden'; forbidden: Forbidden }
  | { status: 'loaded'; event: EventEdit; reference: ReferenceData };

const STATUS_KINDS: Record<EventEdit['status'], InlineStatusKind> = {
  published: 'success',
  inReview: 'neutral',
  draft: 'neutral',
  needsChanges: 'warning',
  past: 'neutral',
  cancelled: 'danger',
  notApproved: 'danger',
};

/** The edit page (`/organize/events/{id}/edit`): the event form and its states (organizer/edit-event). */
@Component({
  selector: 'sx-edit-event-page',
  imports: [
    Alert,
    BackLink,
    Button,
    EmptyState,
    ErrorSummary,
    EventFormFields,
    Icon,
    InlineStatus,
    ReactiveFormsModule,
    RouterLink,
    Skeleton,
    StatusPage,
  ],
  templateUrl: './edit-event-page.html',
  styleUrl: './edit-event-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditEventPage implements OnInit {
  private readonly api = inject(ORGANIZER_EVENTS_API);
  private readonly referenceApi = inject(REFERENCE_DATA_API);
  private readonly drafts = inject(DraftStore);
  private readonly cancelLauncher = inject(CancelEventLauncher);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly summary = viewChild(ErrorSummary);
  protected readonly session = inject(SessionStore);

  /** The event id from the route. */
  readonly id = input.required<string>();

  protected readonly form: EventForm = createEventForm();
  protected readonly state = signal<PageState>({ status: 'loading' });
  /** Skeletons appear only after 300 ms (DelayedSkeleton). */
  protected readonly slow = toSignal(timer(SKELETON_DELAY_MS).pipe(map(() => true)), { initialValue: false });
  protected readonly skeletonSections = [
    [0, 1, 2],
    [0, 1],
    [0, 1, 2],
  ];
  protected readonly contact = CONTACT;
  protected readonly editLead =
    'Changes go live right away. People who added it to their calendar or follow it get an update.';

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveFailed = signal(false);
  protected readonly saved = signal<EventSaved | null>(null);
  protected readonly serverErrors = signal<Partial<Record<FieldName, string>>>({});
  private readonly formValue = toSignal(
    merge(this.form.valueChanges, this.form.statusChanges).pipe(startWith(null)),
  );

  protected readonly event = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.event : null;
  });

  protected readonly isModerator = computed(() => this.session.user()?.role === 'moderator');

  protected readonly errors = computed<FieldErrorItem[]>(() => {
    this.formValue();
    if (!this.submitted()) return [];
    const server = this.serverErrors();
    return FIELD_ORDER.map((name) => ({ name, message: fieldError(this.form, name, server) }))
      .filter((e): e is { name: FieldName; message: string } => !!e.message)
      .map((e) => ({ controlId: e.name, message: e.message }));
  });

  protected readonly error = (name: FieldName): string | null => {
    this.formValue();
    return this.submitted() ? fieldError(this.form, name, this.serverErrors()) : null;
  };

  protected readonly savedText = computed(() => {
    const s = this.saved();
    if (!s) return '';
    if (s.resubmitted)
      return `“${s.title}” is back in review. A moderator looks again, usually within a day.`;
    if (s.status === 'published') {
      return `The listing is updated. The ${s.goingCount.toLocaleString('en-CA')} people going and every calendar feed that includes it will see the new details within an hour.`;
    }
    return 'Your changes are saved. They go live when a moderator approves the event.';
  });

  protected readonly savedActions = computed<AlertAction[]>(() => {
    const s = this.saved();
    return s?.status === 'published' ? [{ label: 'View the listing', link: `/events/${s.slug}` }] : [];
  });

  ngOnInit(): void {
    this.load();
  }

  protected statusKind(event: EventEdit): InlineStatusKind {
    return STATUS_KINDS[event.status];
  }

  protected load(): void {
    this.state.set({ status: 'loading' });
    forkJoin([this.api.getEvent(this.id()), this.referenceApi.get()]).subscribe({
      next: ([event, reference]) => {
        this.fill(event);
        this.state.set({ status: 'loaded', event, reference });
      },
      error: (error: unknown) => {
        if (error instanceof ApiError && error.kind === 'Forbidden') {
          this.state.set({ status: 'forbidden', forbidden: error.extensions as unknown as Forbidden });
        } else {
          this.state.set({ status: 'failed' });
        }
      },
    });
  }

  protected save(): void {
    const event = this.event();
    if (!event || this.saving()) return;
    this.submitted.set(true);
    this.serverErrors.set({});
    this.saveFailed.set(false);
    this.saved.set(null);
    if (this.errors().length) {
      this.focusSummary();
      return;
    }
    this.saving.set(true);
    this.form.disable({ emitEvent: false });
    this.api
      .updateEvent(event.id, this.details())
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.unlock();
        }),
      )
      .subscribe({
        next: (saved) => {
          this.saved.set(saved);
          this.submitted.set(false);
          this.api.getEvent(event.id).subscribe((fresh) => {
            const s = this.state();
            if (s.status === 'loaded') this.state.set({ ...s, event: fresh });
          });
        },
        error: (error: unknown) => {
          if (error instanceof ApiError && error.kind === 'Validation') {
            const server: Partial<Record<FieldName, string>> = {};
            for (const [key, messages] of Object.entries(error.fieldErrors)) {
              if ((FIELD_ORDER as readonly string[]).includes(key)) server[key as FieldName] = messages[0];
            }
            this.serverErrors.set(server);
            this.focusSummary();
          } else if (error instanceof ApiError && error.kind === 'Conflict') {
            this.toasts.show({
              kind: 'info',
              title: 'Someone else changed this event',
              text: 'We loaded the latest details. Make your change again.',
            });
            this.load();
          } else {
            this.saveFailed.set(true);
          }
        },
      });
  }

  /** Copies the details, without the date or times, into the submit page's draft and opens it (L2-055). */
  protected duplicate(): void {
    const raw = this.form.getRawValue();
    this.drafts.write(SUBMIT_DRAFT_KEY, {
      ...raw,
      date: '',
      startTime: '',
      endTime: '',
      contactEmail: this.session.user()?.email ?? '',
    });
    void this.router.navigateByUrl('/submit');
  }

  /** Opens Cancel “{title}”?; once cancelled, the page reloads read-only with the reason (edit-event/cancelled). */
  protected cancelEvent(event: EventEdit, trigger: EventTarget | null): void {
    this.cancelLauncher.open(
      {
        id: event.id,
        title: event.title,
        isPaid: event.isPaid,
        goingCount: event.goingCount,
        emailableAttendees: event.emailableAttendees,
      },
      trigger,
      () => {
        this.saved.set(null);
        this.load();
      },
    );
  }

  protected readOnlyActions(): AlertAction[] {
    return [{ label: 'Duplicate as a new event', run: () => this.duplicate() }];
  }

  private fill(event: EventEdit): void {
    const d = event.details;
    this.form.reset({
      title: d.title,
      organizerName: d.organizerName,
      description: d.description,
      topics: d.topics,
      date: d.date,
      timeZoneId: d.timeZoneId,
      startTime: d.startTime,
      endTime: d.endTime,
      format: d.format,
      venueName: d.venueName ?? '',
      city: d.city ?? 'Toronto',
      streetAddress: d.streetAddress ?? '',
      streamUrl: d.streamUrl ?? '',
      price: d.isFree ? 'free' : 'paid',
      priceCad: d.priceCad === null ? '' : String(d.priceCad),
      ticketUrl: d.ticketUrl ?? '',
      contactEmail: '',
    });
    if (event.isReadOnly) {
      this.form.disable({ emitEvent: false });
    } else {
      this.unlock();
    }
  }

  /** Enables the fields the format and price need; the contact email belongs to the submit page only. */
  private unlock(): void {
    this.form.enable({ emitEvent: false });
    applyFormat(this.form);
    this.form.controls.contactEmail.disable({ emitEvent: false });
  }

  private details(): EventDetailsForm {
    const submission: Partial<ReturnType<typeof toSubmission>> = toSubmission(this.form);
    delete submission.contactEmail;
    return submission as EventDetailsForm;
  }

  /** Moves focus to the error summary once it has rendered, so screen readers announce it. */
  private focusSummary(): void {
    afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
  }
}
