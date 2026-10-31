import type { StoryObj } from '@storybook/angular';
import { DateTile } from '../../../src/lib/date-tile/date-tile';

export const Default: StoryObj<DateTile> = {
  args: { month: 'Nov', day: '5', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<sx-date-tile [month]="month" [day]="day" [size]="size" />`,
  }),
};
