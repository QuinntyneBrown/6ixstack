import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../icon/icon';

/** A muted link back to the parent screen, with a leading arrow (design system: link, back variant). */
@Component({
  selector: 'a[sx-back-link]',
  imports: [Icon],
  template: '<sx-icon name="arrow-left" size="sm" /><ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacingHorizontalXS);
      margin-top: var(--spacingHorizontalXXL);
      color: var(--colorNeutralForeground2);
      text-decoration: none;
      font: var(--sx-text-label);
    }
    :host(:hover) {
      color: var(--colorNeutralForeground1);
    }
    :host(:focus-visible) {
      outline: var(--sx-focus-ring-width) solid var(--colorStrokeFocus2);
      outline-offset: 2px;
      border-radius: var(--borderRadiusSmall);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackLink {}
