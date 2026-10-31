import type { StoryObj } from '@storybook/angular';
import { EventRow } from '../../../src/lib/event-row/event-row';

export const Default: StoryObj<EventRow> = {
  render: () => ({
    props: {
      event: {
        slug: 'azure-data-ai-day-gta',
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
    },
    template: `<sx-event-row [event]="event" date="2026-11-05" />`,
  }),
};
