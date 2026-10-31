import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A person's or group's initials in a circle; decorative next to their name. */
@Component({
  selector: 'sx-avatar',
  template: `<span [class]="'avatar' + (size() === 'md' ? '' : ' avatar--' + size())" aria-hidden="true">{{
    initials()
  }}</span>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--borderRadiusCircular);
      background: var(--colorBrandBackground2);
      color: var(--colorBrandForeground2);
      font: var(--sx-text-label);
      overflow: hidden;
    }
    .avatar--sm {
      width: 2rem;
      height: 2rem;
      font-size: var(--fontSizeBase200);
    }
    .avatar--lg {
      width: 3.5rem;
      height: 3.5rem;
      font-size: var(--sx-font-size-lead);
    }
    .avatar--xl {
      width: 5rem;
      height: 5rem;
      font-size: var(--fontSizeBase600);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avatar {
  readonly initials = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
}
