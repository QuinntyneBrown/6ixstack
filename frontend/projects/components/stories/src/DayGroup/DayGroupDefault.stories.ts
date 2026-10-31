import type { StoryObj } from '@storybook/angular';
import { DayGroup } from '../../../src/lib/day-group/day-group';

export const Default: StoryObj<DayGroup> = {
  render: () => ({
    props: {
      events: [
        {
          slug: 'a',
          title: 'Azure Data & AI Day GTA',
          organizer: 'GTA Azure Community',
          format: 'hybrid',
          topics: ['ai', 'azure'],
          startTimeEt: '9:00 AM',
          sourceTime: null,
          locationLabel: 'Living Arts Centre, Mississauga',
          priceLabel: '$49',
          goingCount: 318,
          isSoldOut: false,
          isCancelled: false,
        },
        {
          slug: 'b',
          title: 'Bedrock in the real world',
          organizer: 'AWS User Group Toronto',
          format: 'inPerson',
          topics: ['ai', 'aws'],
          startTimeEt: '6:00 PM',
          sourceTime: null,
          locationLabel: '120 Bremner Blvd, Toronto',
          priceLabel: 'Free',
          goingCount: 128,
          isSoldOut: false,
          isCancelled: false,
        },
      ],
    },
    template: `<sx-day-group date="2026-11-05" weekday="Thursday" dateLabel="November 5" [events]="events" />`,
  }),
};
