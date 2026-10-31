import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A square tile with a community's initials or a projected icon (design system: logo tile). Decorative next to its
 * name, so it is hidden from assistive technology.
 */
@Component({
  selector: 'sx-logo-tile',
  template: `{{ initials() }}<ng-content />`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--borderRadiusMedium);
      background: var(--colorSubtleBackgroundHover);
      color: var(--colorNeutralForeground1);
      font: var(--fontWeightBold) var(--fontSizeBase400) / 1 var(--fontFamilyBase);
    }
    :host(.logo-tile--lg) {
      width: 4.5rem;
      height: 4.5rem;
      font-size: var(--fontSizeBase600);
      border-radius: var(--borderRadiusXLarge);
    }
  `,
  host: { 'aria-hidden': 'true', '[class.logo-tile--lg]': "size() === 'lg'" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoTile {
  readonly initials = input<string | null>(null);
  readonly size = input<'md' | 'lg'>('md');
}
