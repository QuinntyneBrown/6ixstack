import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A horizontal rule between groups of content. */
@Component({
  selector: 'sx-divider',
  template: `<hr class="divider" />`,
  styles: `
    :host {
      display: block;
    }
    .divider {
      border: 0;
      border-top: 1px solid var(--colorNeutralStroke2);
      margin: var(--sx-divider-margin, var(--spacingHorizontalXXL) 0);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Divider {}
