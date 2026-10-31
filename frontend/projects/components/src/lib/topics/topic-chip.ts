import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TopicKey } from './topics';

/**
 * A toggle button for one topic filter (`<button sx-topic-chip topic="ai" [pressed]="…">AI</button>`): the topic's
 * hue dot before the projected name, with `aria-pressed` (L2-003). Use `TOPIC_LABELS` for the name.
 */
@Component({
  selector: 'button[sx-topic-chip]',
  template: `<span [class]="'topic-dot topic-dot--' + topic()" aria-hidden="true"></span><ng-content />`,
  styleUrls: ['./topic-dot.scss', './topic-chip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'topic-chip',
    type: 'button',
    '[attr.aria-pressed]': 'pressed()',
  },
})
export class TopicChip {
  readonly topic = input.required<TopicKey>();
  readonly pressed = input(false, { transform: booleanAttribute });
}
