import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A calendar-page tile with the month and day ("NOV 5"); decorative, so the date also appears in text. */
@Component({
  selector: 'sx-date-tile',
  template: `<span class="date-tile" [class.date-tile--lg]="size() === 'lg'" aria-hidden="true"
    ><span class="date-tile__month">{{ month() }}</span
    ><span class="date-tile__day">{{ day() }}</span></span
  >`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .date-tile {
      display: inline-grid;
      place-items: center;
      align-content: center;
      width: 3.75rem;
      height: 3.75rem;
      border-radius: var(--borderRadiusXLarge);
      background: var(--sx-date-tile-background, var(--colorSubtleBackgroundHover));
      text-align: center;
    }
    .date-tile__month {
      font: var(--sx-text-overline);
      letter-spacing: var(--sx-letter-spacing-wide);
      text-transform: uppercase;
      color: var(--sx-date-tile-month, var(--colorNeutralForeground2));
    }
    .date-tile__day {
      font: var(--fontWeightBold) var(--fontSizeBase600) / 1 var(--fontFamilyBase);
      color: var(--sx-date-tile-day, inherit);
    }
    .date-tile--lg {
      width: 4.5rem;
      height: 4.5rem;
    }
    .date-tile--lg .date-tile__day {
      font-size: var(--fontSizeHero700);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTile {
  readonly month = input.required<string>();
  readonly day = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
}
