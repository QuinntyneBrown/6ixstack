import type { StoryObj } from '@storybook/angular';
import { FactItem } from '../../../src/lib/fact-item/fact-item';

export const Default: StoryObj<FactItem> = {
  args: { icon: 'users', label: '318 going' },
  render: (args) => ({
    props: args,
    template: `<sx-fact-item [icon]="icon" [label]="label">Capacity 400</sx-fact-item>`,
  }),
};
