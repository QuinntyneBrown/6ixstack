import type { Meta } from '@storybook/angular';
import { InlineStatus } from '../../../src/lib/inline-status/inline-status';
import bestPractices from './InlineStatusBestPractices.md?raw';
import description from './InlineStatusDescription.md?raw';

const meta: Meta<InlineStatus> = {
  title: 'Components/InlineStatus',
  component: InlineStatus,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './InlineStatusDefault.stories';
export { Kinds } from './InlineStatusKinds.stories';
