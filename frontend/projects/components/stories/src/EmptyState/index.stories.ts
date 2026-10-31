import type { Meta } from '@storybook/angular';
import { EmptyState } from '../../../src/lib/empty-state/empty-state';
import bestPractices from './EmptyStateBestPractices.md?raw';
import description from './EmptyStateDescription.md?raw';

const meta: Meta<EmptyState> = {
  title: 'Components/Empty state',
  component: EmptyState,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './EmptyStateDefault.stories';
export { NoResults } from './EmptyStateNoResults.stories';
