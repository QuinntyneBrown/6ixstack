import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormSection } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-form-section-scenario',
  imports: [FormSection],
  template: `@for (i of items(); track i) {
    <sx-form-section title="When" [sectionId]="'s' + i"></sx-form-section>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormSectionScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FormSection', component: FormSectionScenario };
