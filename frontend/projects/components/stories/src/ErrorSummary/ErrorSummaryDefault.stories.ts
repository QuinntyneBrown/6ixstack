import type { StoryObj } from '@storybook/angular';
import { ErrorSummary } from '../../../src/lib/form/error-summary';

export const Default: StoryObj<ErrorSummary> = {
  render: () => ({
    props: {
      errors: [
        { controlId: 'title', message: 'Enter a title for the event.' },
        { controlId: 'topics', message: 'Pick at least one topic so people can find it.' },
        { controlId: 'endTime', message: 'End time must be after the 6:30 PM start.' },
      ],
    },
    template: `<sx-error-summary [errors]="errors" />`,
  }),
};
