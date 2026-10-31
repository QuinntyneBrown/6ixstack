import type { Meta } from '@storybook/angular';
import { FeatureCard } from '../../../src/lib/feature-card/feature-card';
import bestPractices from './FeatureCardBestPractices.md?raw';
import description from './FeatureCardDescription.md?raw';

const meta: Meta<FeatureCard> = {
  title: 'Components/FeatureCard',
  component: FeatureCard,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './FeatureCardDefault.stories';
export { Invitation } from './FeatureCardInvitation.stories';
export { Loading } from './FeatureCardLoading.stories';
