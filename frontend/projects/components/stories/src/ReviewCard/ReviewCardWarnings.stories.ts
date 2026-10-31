import type { StoryObj } from '@storybook/angular';
import { ReviewCard } from '../../../src/lib/review-card/review-card';

export const Warnings: StoryObj<ReviewCard> = {
  render: () => ({
    props: {
      checks: [
        { outcome: 'warning', message: 'No venue address' },
        { outcome: 'warning', message: 'Not a developer topic' },
        { outcome: 'warning', message: 'First submission from this sender' },
      ],
    },
    template: `<ul style="list-style: none; padding: 0;"><li sx-review-card title="Free crypto trading masterclass" organizer="WealthFast Academy" when="Sat, Nov 14 · 2:00 PM" where="Address not given" [checks]="checks" submitted="Yesterday · promo@wealthfast.biz"></li></ul>`,
  }),
};
