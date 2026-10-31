import type { StoryObj } from '@storybook/angular';
import { Toast } from '../../../src/lib/toast/toast';

export const Default: StoryObj<Toast> = {
  render: () => ({
    props: {
      toast: {
        id: 1,
        kind: 'info',
        title: 'Times are in Toronto time (ET)',
        text: "Streams also show the time where they're hosted.",
        remainingMs: 8000,
        paused: true,
      },
    },
    template: `<div style="max-width: 24rem"><sx-toast [toast]="toast" /></div>`,
  }),
};
