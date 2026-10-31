import type { StoryObj } from '@storybook/angular';
import { ReviewCard } from '../../../src/lib/review-card/review-card';

export const Default: StoryObj<ReviewCard> = {
  render: () => ({
    props: {
      checks: [
        { outcome: 'passed', message: 'Stream link reachable' },
        { outcome: 'warning', message: 'Possible duplicate of a Nov 19 listing' },
        { outcome: 'passed', message: 'Organizer has 4 approved events' },
      ],
    },
    template: `<ul class="review-list" style="list-style: none; padding: 0;"><li sx-review-card title="Kubernetes on a budget" organizer="Cloud Native Toronto" when="Thu, Nov 19 · 6:00 PM" where="Streaming online" [topics]="['azure', 'aws']" [checks]="checks" submitted="5 hours ago · hello@cloudnativeto.ca"></li></ul>`,
  }),
};
