import type { Meta } from '@storybook/angular';
import { Skeleton } from '../../../src/lib/skeleton/skeleton';
import bestPractices from './SkeletonBestPractices.md?raw';
import description from './SkeletonDescription.md?raw';

const meta: Meta<Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SkeletonDefault.stories';
export { EventRow } from './SkeletonEventRow.stories';
