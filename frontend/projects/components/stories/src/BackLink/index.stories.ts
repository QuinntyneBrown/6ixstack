import type { Meta } from '@storybook/angular';
import { BackLink } from '../../../src/lib/back-link/back-link';
import bestPractices from './BackLinkBestPractices.md?raw';
import description from './BackLinkDescription.md?raw';

const meta: Meta<BackLink> = {
  title: 'Components/BackLink',
  component: BackLink,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './BackLinkDefault.stories';
