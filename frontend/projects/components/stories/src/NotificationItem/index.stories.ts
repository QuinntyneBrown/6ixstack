import type { Meta } from '@storybook/angular';
import { NotificationItem } from '../../../src/lib/notification-item/notification-item';
import bestPractices from './NotificationItemBestPractices.md?raw';
import description from './NotificationItemDescription.md?raw';

const meta: Meta<NotificationItem> = {
  title: 'Components/NotificationItem',
  component: NotificationItem,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './NotificationItemDefault.stories';
export { Read } from './NotificationItemRead.stories';
