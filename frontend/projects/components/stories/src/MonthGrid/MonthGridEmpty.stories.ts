import type { StoryObj } from '@storybook/angular';
import { MonthGrid } from '../../../src/lib/calendar/month-grid';

export const Empty: StoryObj<MonthGrid> = {
  render: () => ({
    template: `<sx-month-grid month="2026-12" label="December 2026" today="2026-11-02" />`,
  }),
};
