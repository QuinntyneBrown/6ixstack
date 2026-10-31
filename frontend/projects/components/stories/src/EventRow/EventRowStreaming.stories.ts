import type { StoryObj } from '@storybook/angular';
import { EventRow } from '../../../src/lib/event-row/event-row';

export const Streaming: StoryObj<EventRow> = {
  render: () => ({
    props: {
      event: {
        slug: 'azure-ai-foundry',
        title: 'Azure AI Foundry: shipping agents to production',
        organizer: 'Microsoft Reactor',
        format: 'streaming',
        topics: ['ai', 'azure'],
        startTimeEt: '12:00 PM',
        sourceTime: '9:00 AM PT',
        locationLabel: 'Streaming online',
        priceLabel: 'Free',
        goingCount: 2310,
        isSoldOut: false,
        isCancelled: false,
      },
    },
    template: `<sx-event-row [event]="event" date="2026-11-04" />`,
  }),
};
