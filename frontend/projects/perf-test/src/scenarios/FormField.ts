import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, Input } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-form-field-scenario',
  imports: [FormField, Input],
  template: `@for (i of items(); track i) {
    <sx-form-field label="Event title" [controlId]="'f' + i" hint="Up to 90 characters."
      ><input sx-input [id]="'f' + i"
    /></sx-form-field>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormFieldScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FormField', component: FormFieldScenario };
