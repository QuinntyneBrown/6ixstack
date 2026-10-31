import type { Meta } from '@storybook/angular';
import { Divider } from '../../../src/lib/divider/divider';
import bestPractices from './DividerBestPractices.md?raw';
import description from './DividerDescription.md?raw';

const meta: Meta<Divider> = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DividerDefault.stories';
