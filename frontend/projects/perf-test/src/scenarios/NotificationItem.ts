import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NotificationItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-notification-item-scenario',
  imports: [NotificationItem],
  template: `@for (i of items(); track i) {
    <sx-notification-item title="Update" link="/" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NotificationItemScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'NotificationItem', component: NotificationItemScenario };
