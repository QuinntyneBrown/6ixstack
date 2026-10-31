import type { StoryObj } from '@storybook/angular';
import { ReviewCard } from '../../../src/lib/review-card/review-card';

export const Checking: StoryObj<ReviewCard> = {
  render: () => ({
    props: {
      checks: [
        { outcome: 'pending', message: 'Checking…' },
        { outcome: 'pending', message: 'Checking…' },
        { outcome: 'pending', message: 'Checking…' },
      ],
    },
    template: `<ul style="list-style: none; padding: 0;"><li sx-review-card title="Blazor at the edge" organizer="Toronto .NET User Group" when="Tue, Nov 24 · 6:00 PM" where="Microsoft Canada, 81 Bay St, Toronto" [topics]="['dotnet']" [checks]="checks" submitted="Just now · hello@torontodotnet.ca"></li></ul>`,
  }),
};
