import type { StoryObj } from '@storybook/angular';
import { BackLink } from '../../../src/lib/back-link/back-link';

export const Default: StoryObj<BackLink> = {
  render: () => ({
    template: `<a sx-back-link href="#">Your events</a>`,
  }),
};
