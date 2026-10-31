import type { StoryObj } from '@storybook/angular';
import { ErrorSummary } from '../../../src/lib/form/error-summary';

export const OneError: StoryObj<ErrorSummary> = {
  render: () => ({
    props: { errors: [{ controlId: 'title', message: 'Enter a title for the event.' }] },
    template: `<sx-error-summary [errors]="errors" />`,
  }),
};
