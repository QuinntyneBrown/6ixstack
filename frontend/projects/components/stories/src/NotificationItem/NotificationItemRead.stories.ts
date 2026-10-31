import type { StoryObj } from '@storybook/angular';
import { NotificationItem } from '../../../src/lib/notification-item/notification-item';

export const Read: StoryObj<NotificationItem> = {
  render: () => ({
    template: `<ul style="list-style:none;padding:0;max-width:40rem"><li><sx-notification-item title="“Copilot Studio for developers” is live" link="/events/copilot-studio-for-developers" text="Approved by a moderator." time="Oct 8" tone="success" /></li></ul>`,
  }),
};
