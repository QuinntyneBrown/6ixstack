import type { StoryObj } from '@storybook/angular';
import { ErrorSummary } from '../../../src/lib/form/error-summary';

export const CustomHeading: StoryObj<ErrorSummary> = {
  render: () => ({
    props: { errors: [{ controlId: 'email', message: 'Enter an email address like name@example.com.' }] },
    template: `<sx-error-summary heading="Check your email address" [errors]="errors" />`,
  }),
};
