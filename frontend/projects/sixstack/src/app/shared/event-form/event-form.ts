import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { EventSubmission } from 'api';

/** The submit and edit forms' controls; names match the API contract and its field errors (L2-041). */
export type EventForm = FormGroup<{
  title: FormControl<string>;
  organizerName: FormControl<string>;
  description: FormControl<string>;
  topics: FormControl<string[]>;
  date: FormControl<string>;
  timeZoneId: FormControl<string>;
  startTime: FormControl<string>;
  endTime: FormControl<string>;
  format: FormControl<'inPerson' | 'streaming' | 'hybrid'>;
  venueName: FormControl<string>;
  city: FormControl<string>;
  streetAddress: FormControl<string>;
  streamUrl: FormControl<string>;
  price: FormControl<'free' | 'paid'>;
  priceCad: FormControl<string>;
  ticketUrl: FormControl<string>;
  contactEmail: FormControl<string>;
}>;

/** Controls in the order they appear, which is the order of the error summary. */
export const FIELD_ORDER = [
  'title',
  'organizerName',
  'description',
  'topics',
  'date',
  'timeZoneId',
  'startTime',
  'endTime',
  'format',
  'venueName',
  'city',
  'streetAddress',
  'streamUrl',
  'priceCad',
  'ticketUrl',
  'contactEmail',
] as const;

export type FieldName = (typeof FIELD_ORDER)[number];

const required =
  (message: string): ValidatorFn =>
  (c) =>
    typeof c.value === 'string' ? (c.value.trim() ? null : { message }) : c.value ? null : { message };
const maxLength =
  (n: number, message: string): ValidatorFn =>
  (c) =>
    typeof c.value === 'string' && c.value.length > n ? { message } : null;
const httpsUrl: ValidatorFn = (c) => {
  const value = (c.value as string).trim();
  if (!value) return null;
  try {
    return new URL(value).protocol === 'https:'
      ? null
      : { message: 'Enter a full link that starts with https://' };
  } catch {
    return { message: 'Enter a full link that starts with https://' };
  }
};

/** Today's date in Toronto as yyyy-MM-dd ("not in the past" is judged by the Toronto calendar day). */
export function torontoToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(now);
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** Group rule: the end time comes after the start; reported on `endTime` by `fieldError`. */
const endAfterStart: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startTime')!.value as string;
  const end = group.get('endTime')!.value as string;
  return start && end && end <= start
    ? { endTime: `End time must be after the ${formatTime(start)} start.` }
    : null;
};

/** The message to show for a field: its own validators first, then group rules, then a server error. */
export function fieldError(
  form: EventForm,
  name: FieldName,
  serverErrors: Partial<Record<FieldName, string>>,
): string | null {
  const control = form.controls[name];
  if (control.disabled) return null;
  return (
    (control.errors?.['message'] as string | undefined) ??
    (form.errors?.[name] as string | undefined) ??
    serverErrors[name] ??
    null
  );
}

export function createEventForm(): EventForm {
  return new FormGroup(
    {
      title: new FormControl('', {
        nonNullable: true,
        validators: [
          required('Enter a title for the event.'),
          maxLength(90, 'Keep the title to 90 characters or fewer.'),
        ],
      }),
      organizerName: new FormControl('', {
        nonNullable: true,
        validators: [
          required('Enter the community or organizer.'),
          maxLength(120, 'Keep the organizer to 120 characters or fewer.'),
        ],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [
          required('Describe the event in a sentence or two.'),
          maxLength(2000, 'Keep the description to 2,000 characters or fewer.'),
        ],
      }),
      topics: new FormControl<string[]>([], {
        nonNullable: true,
        validators: [
          (c) =>
            (c.value as string[]).length
              ? null
              : { message: 'Pick at least one topic so people can find it.' },
        ],
      }),
      date: new FormControl('', {
        nonNullable: true,
        validators: [
          required('Enter the date.'),
          (c) =>
            c.value && c.value < torontoToday() ? { message: "Choose a date that hasn't passed." } : null,
        ],
      }),
      timeZoneId: new FormControl('America/Toronto', { nonNullable: true }),
      startTime: new FormControl('', { nonNullable: true, validators: [required('Enter a start time.')] }),
      endTime: new FormControl('', { nonNullable: true, validators: [required('Enter an end time.')] }),
      format: new FormControl<'inPerson' | 'streaming' | 'hybrid'>('inPerson', { nonNullable: true }),
      venueName: new FormControl('', { nonNullable: true, validators: [required('Enter the venue name.')] }),
      city: new FormControl('Toronto', { nonNullable: true }),
      streetAddress: new FormControl('', {
        nonNullable: true,
        validators: [required('Enter the street address.')],
      }),
      streamUrl: new FormControl(
        { value: '', disabled: true },
        { nonNullable: true, validators: [httpsUrl] },
      ),
      price: new FormControl<'free' | 'paid'>('free', { nonNullable: true }),
      priceCad: new FormControl(
        { value: '', disabled: true },
        {
          nonNullable: true,
          validators: [
            (c) => (Number(c.value) > 0 ? null : { message: 'Enter a price above $0.' }),
            (c) => (Number(c.value) > 10_000 ? { message: 'Enter a price of $10,000 or less.' } : null),
          ],
        },
      ),
      ticketUrl: new FormControl('', { nonNullable: true, validators: [httpsUrl] }),
      contactEmail: new FormControl('', {
        nonNullable: true,
        validators: [
          required('Enter your email address.'),
          (c) =>
            c.value && Validators.email(c)
              ? { message: 'Enter an email address like name@example.com.' }
              : null,
        ],
      }),
    },
    { validators: [endAfterStart] },
  );
}

/** Shows and enables only the fields the format and price need (L2-042); disabled controls are not submitted. */
export function applyFormat(form: EventForm): void {
  const format = form.controls.format.value;
  const venue = [form.controls.venueName, form.controls.city, form.controls.streetAddress];
  for (const control of venue) {
    if (format === 'streaming') control.disable({ emitEvent: false });
    else control.enable({ emitEvent: false });
  }
  if (format === 'inPerson') form.controls.streamUrl.disable({ emitEvent: false });
  else form.controls.streamUrl.enable({ emitEvent: false });
  if (form.controls.price.value === 'free') form.controls.priceCad.disable({ emitEvent: false });
  else form.controls.priceCad.enable({ emitEvent: false });
}

export function toSubmission(form: EventForm): EventSubmission {
  const v = form.getRawValue();
  const hasVenue = v.format !== 'streaming';
  const blank = (s: string) => (s.trim() ? s.trim() : null);
  return {
    title: v.title.trim(),
    organizerName: v.organizerName.trim(),
    description: v.description.trim(),
    topics: v.topics,
    date: v.date,
    timeZoneId: v.timeZoneId,
    startTime: v.startTime,
    endTime: v.endTime,
    format: v.format,
    venueName: hasVenue ? blank(v.venueName) : null,
    city: hasVenue ? v.city : null,
    streetAddress: hasVenue ? blank(v.streetAddress) : null,
    streamUrl: v.format === 'inPerson' ? null : blank(v.streamUrl),
    isFree: v.price === 'free',
    priceCad: v.price === 'free' ? null : Number(v.priceCad),
    ticketUrl: blank(v.ticketUrl),
    contactEmail: v.contactEmail.trim(),
  };
}
