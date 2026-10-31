import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One titled section of a long form ("Event basics", "When"…), with a short lead under the title. */
@Component({
  selector: 'sx-form-section',
  template: `
    <section class="form-section" [attr.aria-labelledby]="sectionId() + '-title'">
      <h2 [id]="sectionId() + '-title'">{{ title() }}</h2>
      @if (lead()) {
        <p>{{ lead() }}</p>
      }
      <div class="form-section__body"><ng-content /></div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      font: var(--sx-text-h4);
    }
    p {
      margin-top: var(--spacingHorizontalXS);
      color: var(--colorNeutralForeground2);
      font: var(--sx-text-body-sm);
    }
    .form-section__body {
      display: grid;
      gap: var(--spacingHorizontalXL);
      margin-top: var(--spacingHorizontalXL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSection {
  readonly title = input.required<string>();
  readonly sectionId = input.required<string>();
  readonly lead = input<string | null>(null);
}
