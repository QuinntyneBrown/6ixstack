import type { StoryObj } from '@storybook/angular';
import { EventRow } from '../../../src/lib/event-row/event-row';

export const SoldOut: StoryObj<EventRow> = {
  render: () => ({
    props: {
      event: {
        slug: 'rag',
        title: 'RAG evaluation workshop',
        organizer: 'Women in AI Toronto',
        format: 'inPerson',
        topics: ['ai'],
        startTimeEt: '6:00 PM',
        sourceTime: null,
        locationLabel: 'Vector Institute, Toronto',
        priceLabel: 'Sold out',
        goingCount: 60,
        isSoldOut: true,
        isCancelled: false,
      },
    },
    template: `<sx-event-row [event]="event" date="2026-11-10" />`,
  }),
};
