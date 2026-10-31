import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TOPIC_LABELS, TopicKey } from './topics';

/** A topic's hue dot and name, read-only (event rows, cards). */
@Component({
  selector: 'sx-topic-tag',
  template: `<span class="topic-tag"
    ><span [class]="'topic-dot topic-dot--' + topic()" aria-hidden="true"></span>{{ label() }}</span
  >`,
  styleUrls: ['./topic-dot.scss', './topic-tag.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicTag {
  readonly topic = input.required<TopicKey>();
  protected readonly label = computed(() => TOPIC_LABELS[this.topic()]);
}
