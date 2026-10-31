import type { StoryObj } from '@storybook/angular';
import { Avatar } from '../../../src/lib/avatar/avatar';

export const Default: StoryObj<Avatar> = {
  args: { initials: 'PN', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<sx-avatar [initials]="initials" [size]="size" />`,
  }),
};
