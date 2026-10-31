import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TopicChip } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-topic-chip-scenario',
  imports: [TopicChip],
  template: `@for (i of items(); track i) {
    <button sx-topic-chip topic="react">React</button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TopicChipScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'TopicChip', component: TopicChipScenario };
