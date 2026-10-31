import type { StoryObj } from '@storybook/angular';
import { CalendarDayList } from '../../../src/lib/calendar/calendar-day-list';

export const Default: StoryObj<CalendarDayList> = {
  render: () => ({
    props: {
      events: [
        { title: 'Azure Data & AI Day GTA', link: '/', time: '9:00 AM', topic: 'azure' },
        { title: 'Bedrock in the real world', link: '/', time: '6:00 PM', topic: 'aws' },
      ],
    },
    template: `<sx-calendar-day-list heading="Thursday, November 5" [events]="events" />`,
  }),
};
