import type { Meta } from '@storybook/angular';
import { NextSteps } from '../../../src/lib/next-steps/next-steps';
import bestPractices from './NextStepsBestPractices.md?raw';
import description from './NextStepsDescription.md?raw';

const meta: Meta<NextSteps> = {
  title: 'Components/NextSteps',
  component: NextSteps,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './NextStepsDefault.stories';
