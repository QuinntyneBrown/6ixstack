import type { StoryObj } from '@storybook/angular';
import { NotificationItem } from '../../../src/lib/notification-item/notification-item';

export const Default: StoryObj<NotificationItem> = {
  render: () => ({
    template: `<ul style="list-style:none;padding:0;max-width:40rem"><li><sx-notification-item title="“Azure Bicep clinic” needs changes" link="/organize" text="Reason: missing or unclear venue address. Edit it and resubmit." time="Oct 30" tone="danger" [unread]="true" /></li></ul>`,
  }),
};
