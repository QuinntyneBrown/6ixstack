import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';

export const Labelled: StoryObj<Icon> = {
  args: { name: 'radio', label: 'Streaming' },
  render: (args) => ({ props: args, template: `<sx-icon [name]="name" [label]="label" />` }),
};
