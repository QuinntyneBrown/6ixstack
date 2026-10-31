import type { StoryObj } from '@storybook/angular';
import { Skeleton } from '../../../src/lib/skeleton/skeleton';

export const EventRow: StoryObj<Skeleton> = {
  render: () => ({
    template: `<div style="display: grid; grid-template-columns: 4.5rem 1fr; gap: 1rem; max-width: 40rem"><sx-skeleton width="3.5rem" /><div><sx-skeleton variant="title" width="70%" /><sx-skeleton width="40%" /><sx-skeleton width="55%" /></div></div>`,
  }),
};
