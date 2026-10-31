import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A plain list of related items in one bordered surface (design system: list). Hosts `li[sx-list-item]`. */
@Component({
  selector: 'ul[sx-list]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      list-style: none;
      padding: 0;
      margin: 0;
      border: 1px solid var(--colorNeutralStroke2);
      border-radius: var(--borderRadiusXLarge);
      background: var(--colorNeutralBackground1);
    }
  `,
  host: { class: 'list' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List {}

/**
 * One row of a list: a leading visual (`[slot=leading]`), a title, a meta line (`meta` input, or `[slot=meta]` for
 * richer content such as a skeleton) and trailing actions (`[slot=actions]`).
 */
@Component({
  selector: 'li[sx-list-item]',
  template: `
    <ng-content select="[slot=leading]" />
    <div class="list__body">
      <div class="list__title">{{ title() }}</div>
      <div class="list__meta">
        @if (meta()) {
          {{ meta() }}
        }
        <ng-content select="[slot=meta]" />
      </div>
    </div>
    <ng-content select="[slot=actions]" />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalM);
      padding: var(--spacingHorizontalM) var(--spacingHorizontalL);
      border-bottom: 1px solid var(--colorNeutralStroke2);
    }
    :host(:last-child) {
      border-bottom: 0;
    }
    .list__body {
      flex: 1;
      min-width: 0;
    }
    .list__title {
      font: var(--sx-text-label);
    }
    .list__meta {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalXS);
      font: var(--sx-text-body-sm);
      color: var(--colorNeutralForeground2);
    }
  `,
  host: { class: 'list__item' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItem {
  readonly title = input.required<string>();
  readonly meta = input<string | null>(null);
}
