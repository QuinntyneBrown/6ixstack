import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';

export const Default: StoryObj<Icon> = {
  args: { name: 'calendar' },
  render: (args) => ({ props: args, template: `<sx-icon [name]="name" />` }),
};
