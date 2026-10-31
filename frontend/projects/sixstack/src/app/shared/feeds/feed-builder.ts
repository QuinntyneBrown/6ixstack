import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FeedChoice, FeedScope } from 'api';
import { Check, Choice, FieldSet, TopicKey, TOPICS, TopicTag } from 'components';

const SCOPES: { value: FeedScope; label: string }[] = [
  { value: 'all', label: 'GTA and streaming' },
  { value: 'gtaOnly', label: 'GTA only' },
  { value: 'streamingOnly', label: 'Streaming only' },
];

/**
 * The custom feed choice (L2-035): "All topics" or one or more topics, and where. `choice()` validates, shows the
 * topic error and moves focus to the first checkbox when nothing is chosen. The host owns the Create button.
 */
@Component({
  selector: 'sx-feed-builder',
  imports: [Check, Choice, FieldSet, ReactiveFormsModule, TopicTag],
  template: `
    <sx-field-set legend="Topics" controlId="feed-topics" [error]="error()">
      <label sx-choice class="all-topics">
        <input
          sx-check
          type="checkbox"
          id="feed-topics"
          [formControl]="allTopics"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? 'feed-topics-error' : null"
        />All topics
      </label>
      <div class="topic-grid">
        @for (topic of topics; track topic) {
          <label sx-choice>
            <input
              sx-check
              type="checkbox"
              [checked]="chosen().includes(topic)"
              [disabled]="busy() || allTopics.value"
              [attr.aria-invalid]="error() ? 'true' : null"
              [attr.aria-describedby]="error() ? 'feed-topics-error' : null"
              (change)="toggle(topic, $any($event.target).checked)"
            /><sx-topic-tag [topic]="topic" />
          </label>
        }
      </div>
    </sx-field-set>
    <sx-field-set legend="Where" controlId="feed-where">
      <div class="choice-row">
        @for (scope of scopes; track scope.value) {
          <label sx-choice
            ><input sx-check type="radio" name="feed-where" [value]="scope.value" [formControl]="where" />{{
              scope.label
            }}</label
          >
        }
      </div>
    </sx-field-set>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--spacingHorizontalXL);
    }
    .topic-grid {
      display: grid;
      gap: var(--spacingHorizontalS);
    }
    @media (min-width: 36rem) {
      .topic-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .choice-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacingHorizontalS) var(--spacingHorizontalXL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedBuilder {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly busy = input(false);

  protected readonly topics = TOPICS;
  protected readonly scopes = SCOPES;
  protected readonly allTopics = new FormControl(false, { nonNullable: true });
  protected readonly where = new FormControl<FeedScope>('all', { nonNullable: true });
  protected readonly chosen = signal<TopicKey[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.allTopics.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.error.set(null));
    effect(() => this.setBusy(this.busy()));
  }

  /** Locks or unlocks the choices while a feed is being created (L2-035 criterion 4). */
  private setBusy(busy: boolean): void {
    for (const control of [this.allTopics, this.where]) {
      if (busy) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }

  protected toggle(topic: TopicKey, checked: boolean): void {
    this.error.set(null);
    this.chosen.update((list) =>
      checked ? TOPICS.filter((t) => [...list, topic].includes(t)) : list.filter((t) => t !== topic),
    );
  }

  /** The validated choice, or null after showing why (L2-035 criterion 2). */
  choice(): FeedChoice | null {
    const all = this.allTopics.value;
    if (!all && this.chosen().length === 0) {
      this.error.set('Pick at least one topic, or choose “All topics”.');
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLInputElement>('#feed-topics')?.focus(),
        {
          injector: this.injector,
        },
      );
      return null;
    }
    return { topics: all ? [] : this.chosen(), allTopics: all, scope: this.where.value };
  }
}
