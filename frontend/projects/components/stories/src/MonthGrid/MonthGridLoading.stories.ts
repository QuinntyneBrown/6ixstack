import type { StoryObj } from '@storybook/angular';
import { MonthGrid } from '../../../src/lib/calendar/month-grid';

export const Loading: StoryObj<MonthGrid> = {
  render: () => ({
    template: `<sx-month-grid month="2026-11" label="November 2026" today="2026-11-02" [loading]="true" />`,
  }),
};
