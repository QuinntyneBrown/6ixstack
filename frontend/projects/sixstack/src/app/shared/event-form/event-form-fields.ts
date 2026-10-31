import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ReferenceData } from 'api';
import {
  Check,
  Choice,
  describedBy,
  FieldSet,
  FormField,
  FormSection,
  Input,
  isTopic,
  TopicKey,
  TopicTag,
} from 'components';
import { merge } from 'rxjs';
import { applyFormat, EventForm, FieldName } from './event-form';

/**
 * The event form's sections (Event basics, When, Where, Tickets and, on submit, the contact email), shared by the
 * submit and edit pages. Fields follow the format and price (L2-042); `error` gives each field's message.
 */
@Component({
  selector: 'sx-event-form-fields',
  imports: [Check, Choice, FieldSet, FormField, FormSection, Input, ReactiveFormsModule, TopicTag],
  templateUrl: './event-form-fields.html',
  styleUrl: './event-form-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventFormFields implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<EventForm>();
  readonly reference = input.required<ReferenceData>();
  readonly error = input.required<(name: FieldName) => string | null>();
  readonly busy = input(false);
  readonly showContact = input(true);

  protected readonly describedBy = describedBy;
  protected readonly topics = computed<TopicKey[]>(() =>
    this.reference()
      .topics.map((t) => t.key)
      .filter(isTopic),
  );

  ngOnInit(): void {
    const form = this.form();
    applyFormat(form);
    merge(form.controls.format.valueChanges, form.controls.price.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => applyFormat(form));
  }

  protected isTopicChecked(topic: string): boolean {
    return this.form().controls.topics.value.includes(topic);
  }

  protected toggleTopic(topic: string, checked: boolean): void {
    const control = this.form().controls.topics;
    const current = control.value;
    control.setValue(checked ? [...current, topic] : current.filter((t) => t !== topic));
  }
}
