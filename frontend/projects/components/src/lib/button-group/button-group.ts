import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Joins related `sx-button`s into one control with a shared border (design system: button group), e.g. the
 * calendar's List / Month switch. The pressed button carries `aria-pressed="true"`.
 */
@Component({
  selector: 'sx-button-group',
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-flex;
    }
    :host ::ng-deep > [sx-button] {
      border-radius: 0;
      margin-left: -1px;
    }
    :host ::ng-deep > [sx-button]:first-child {
      border-radius: var(--borderRadiusMedium) 0 0 var(--borderRadiusMedium);
      margin-left: 0;
    }
    :host ::ng-deep > [sx-button]:last-child {
      border-radius: 0 var(--borderRadiusMedium) var(--borderRadiusMedium) 0;
    }
    :host ::ng-deep > [sx-button][aria-pressed='true'] {
      background: var(--colorBrandBackground2);
      color: var(--colorBrandForeground1);
      border-color: var(--colorBrandStroke1);
      z-index: 1;
    }
  `,
  host: { role: 'group', '[attr.aria-label]': 'label()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroup {
  readonly label = input.required<string>();
}
