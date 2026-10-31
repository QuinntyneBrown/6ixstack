import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { CalendarDayList } from '../../../src/lib/calendar/calendar-day-list';
import bestPractices from './CalendarDayListBestPractices.md?raw';
import description from './CalendarDayListDescription.md?raw';

const meta: Meta<CalendarDayList> = {
  title: 'Components/CalendarDayList',
  component: CalendarDayList,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './CalendarDayListDefault.stories';
