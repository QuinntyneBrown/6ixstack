import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, IconName } from './icons';

/**
 * An icon from the 6ixstack set. Decorative by default (`aria-hidden`); pass `label` when the icon
 * alone carries meaning. Renders the mock's `<svg class="icon">` so `.btn .icon` style rules apply.
 */
@Component({
  selector: 'sx-icon',
  template: `<svg
    [attr.class]="'icon' + (size() === 'md' ? '' : ' icon--' + size())"
    viewBox="0 0 24 24"
    [attr.aria-hidden]="label() ? null : 'true'"
    [attr.role]="label() ? 'img' : null"
    [attr.aria-label]="label() || null"
    [innerHTML]="paths()"
  ></svg>`,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();
  readonly label = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  // The paths are compile-time constants from ICONS, never user input.
  protected readonly paths = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]));
}
