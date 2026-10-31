import type { StoryObj } from '@storybook/angular';
import { EventRow } from '../../../src/lib/event-row/event-row';

export const Cancelled: StoryObj<EventRow> = {
  render: () => ({
    props: {
      event: {
        slug: 'blazor',
        title: 'Blazor vs Angular: a friendly fight',
        organizer: 'Brampton Dev Night',
        format: 'inPerson',
        topics: ['dotnet', 'angular'],
        startTimeEt: '6:30 PM',
        sourceTime: null,
        locationLabel: 'Brampton Innovation District, Brampton',
        priceLabel: 'Cancelled',
        goingCount: 74,
        isSoldOut: false,
        isCancelled: true,
      },
    },
    template: `<sx-event-row [event]="event" date="2026-11-12" />`,
  }),
};
