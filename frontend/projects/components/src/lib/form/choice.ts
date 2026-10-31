import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The box of a checkbox or radio (`<input type="checkbox" sx-check>`), drawn to the 6ixstack style. */
@Component({
  selector: 'input[type=checkbox][sx-check], input[type=radio][sx-check]',
  template: '',
  styleUrl: './check.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Check {}

/**
 * A label around one checkbox or radio and its text (`<label sx-choice><input sx-check …>AI</label>`); `card`
 * draws the format cards; `hint` adds a second line.
 */
@Component({
  selector: 'label[sx-choice]',
  template: `<ng-content select="[sx-check]" /><span class="choice__text"
      ><ng-content />
      @if (hint()) {
        <small>{{ hint() }}</small>
      }
    </span>`,
  styleUrl: './choice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.choice-card]': 'card()' },
})
export class Choice {
  readonly hint = input<string | null>(null);
  readonly card = input(false, { transform: booleanAttribute });
}
