import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

/** "Skip to content": the first focus stop; moves focus to the element with id `target` (L2-091). */
@Component({
  selector: 'sx-skip-link',
  template: `<a class="skip-link" [href]="'#' + target()" (click)="skip($event)"
    ><ng-content>Skip to content</ng-content></a
  >`,
  styleUrl: './skip-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLink {
  private readonly document = inject(DOCUMENT);

  readonly target = input('main');

  protected skip(event: Event): void {
    const target = this.document.getElementById(this.target());
    if (!target) {
      return;
    }
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus();
    target.scrollIntoView();
  }
}
