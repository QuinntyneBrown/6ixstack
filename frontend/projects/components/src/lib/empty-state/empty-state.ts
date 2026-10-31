import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/**
 * Says why there is nothing to show and what to do next: an icon, a title, a sentence (`[slot=text]`) and up to
 * two actions (`[slot=actions]`). Used for "never had content", "filters remove everything" and "can't access".
 */
@Component({
  selector: 'sx-empty-state',
  imports: [Icon],
  template: `
    <div class="empty" [class.empty--compact]="compact()" [class.empty--error]="error()">
      <div class="empty__icon"><sx-icon [name]="icon()" size="lg" /></div>
      @if (headingLevel() === 1) {
        <h1 class="empty__title">{{ title() }}</h1>
      } @else {
        <h2 class="empty__title">{{ title() }}</h2>
      }
      <div class="empty__text"><ng-content select="[slot=text]" /></div>
      <div class="empty__actions"><ng-content select="[slot=actions]" /></div>
    </div>
  `,
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly icon = input<IconName>('inbox');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly error = input(false, { transform: booleanAttribute });
  /** 1 when the empty state is the whole page, such as a page that failed to load. */
  readonly headingLevel = input<1 | 2>(2);
}
