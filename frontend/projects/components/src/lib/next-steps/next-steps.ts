import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A numbered list of what happens next, without implying progress (the design system's stepper, `steps-next`). */
@Component({
  selector: 'sx-next-steps',
  template: `
    <ol class="steps-next">
      @for (step of steps(); track $index) {
        <li>{{ step }}</li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
    }
    .steps-next {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalM);
      counter-reset: next;
    }
    li {
      display: grid;
      grid-template-columns: 1.75rem minmax(0, 1fr);
      gap: var(--spacingHorizontalM);
      align-items: center;
      counter-increment: next;
    }
    li::before {
      content: counter(next);
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: var(--colorSubtleBackgroundHover);
      font: var(--sx-text-caption);
      font-weight: var(--fontWeightSemibold);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextSteps {
  readonly steps = input.required<string[]>();
}
