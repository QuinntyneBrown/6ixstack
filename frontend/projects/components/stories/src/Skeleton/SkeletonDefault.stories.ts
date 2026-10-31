import type { StoryObj } from '@storybook/angular';
import { Skeleton } from '../../../src/lib/skeleton/skeleton';

export const Default: StoryObj<Skeleton> = {
  args: { variant: 'text', width: '60%' },
  render: (args) => ({
    props: args,
    template: `<sx-skeleton [variant]="variant" [width]="width" />`,
  }),
};
