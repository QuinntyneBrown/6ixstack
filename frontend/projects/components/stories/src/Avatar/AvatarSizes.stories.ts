import type { StoryObj } from '@storybook/angular';
import { Avatar } from '../../../src/lib/avatar/avatar';

export const Sizes: StoryObj<Avatar> = {
  render: () => ({
    template: `<div class="cluster"><sx-avatar initials="PN" size="sm" /><sx-avatar initials="PN" /><sx-avatar initials="PN" size="lg" /><sx-avatar initials="PN" size="xl" /></div>`,
  }),
};
