import type { StoryObj } from '@storybook/angular';
import { Divider } from '../../../src/lib/divider/divider';

export const Default: StoryObj<Divider> = {
  render: () => ({
    template: `<p>Events</p><sx-divider /><p>Calendar feeds</p>`,
  }),
};
