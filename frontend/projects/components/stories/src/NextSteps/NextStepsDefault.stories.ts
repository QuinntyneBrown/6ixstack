import type { StoryObj } from '@storybook/angular';
import { NextSteps } from '../../../src/lib/next-steps/next-steps';

export const Default: StoryObj<NextSteps> = {
  render: () => ({
    props: {
      steps: [
        'A moderator checks the details, usually within a day.',
        'We email you when it’s live, or what to fix if something is missing.',
        'It appears in the list, the calendar and every matching feed.',
      ],
    },
    template: `<sx-next-steps [steps]="steps" />`,
  }),
};
