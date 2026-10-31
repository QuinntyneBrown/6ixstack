import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A shimmering placeholder for content that is still loading; static under reduced motion. */
@Component({
  selector: 'sx-skeleton',
  template: `<span
    [class]="'skeleton skeleton--' + variant()"
    [style.width]="width()"
    [style.height]="height()"
    aria-hidden="true"
  ></span>`,
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  readonly variant = input<'text' | 'title' | 'circle' | 'rect'>('text');
  readonly width = input<string | null>(null);
  readonly height = input<string | null>(null);
}
