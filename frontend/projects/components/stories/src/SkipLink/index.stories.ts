import type { Meta } from '@storybook/angular';
import { SkipLink } from '../../../src/lib/skip-link/skip-link';
import bestPractices from './SkipLinkBestPractices.md?raw';
import description from './SkipLinkDescription.md?raw';

const meta: Meta<SkipLink> = {
  title: 'Components/Skip link',
  component: SkipLink,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SkipLinkDefault.stories';
