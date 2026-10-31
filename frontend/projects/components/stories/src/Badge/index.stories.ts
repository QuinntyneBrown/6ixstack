import type { Meta } from '@storybook/angular';
import { Badge } from '../../../src/lib/badge/badge';
import bestPractices from './BadgeBestPractices.md?raw';
import description from './BadgeDescription.md?raw';

const meta: Meta<Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './BadgeDefault.stories';
export { Kinds } from './BadgeKinds.stories';
