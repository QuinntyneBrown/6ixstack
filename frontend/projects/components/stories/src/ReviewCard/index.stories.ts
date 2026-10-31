import type { Meta } from '@storybook/angular';
import { ReviewCard } from '../../../src/lib/review-card/review-card';
import bestPractices from './ReviewCardBestPractices.md?raw';
import description from './ReviewCardDescription.md?raw';

const meta: Meta<ReviewCard> = {
  title: 'Components/ReviewCard',
  component: ReviewCard,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ReviewCardDefault.stories';
export { Warnings } from './ReviewCardWarnings.stories';
export { Checking } from './ReviewCardChecking.stories';
