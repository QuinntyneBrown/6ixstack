import type { StoryObj } from '@storybook/angular';
import { DateTile } from '../../../src/lib/date-tile/date-tile';

export const Large: StoryObj<DateTile> = {
  render: () => ({
    template: `<sx-date-tile month="Nov" day="12" size="lg" />`,
  }),
};
