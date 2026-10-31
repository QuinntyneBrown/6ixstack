import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TopicTag } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-topic-tag-scenario',
  imports: [TopicTag],
  template: `@for (i of items(); track i) {
    <sx-topic-tag topic="azure" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TopicTagScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'TopicTag', component: TopicTagScenario };
