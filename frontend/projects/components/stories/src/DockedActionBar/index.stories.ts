import type { Meta } from '@storybook/angular';
import { DockedActionBar } from '../../../src/lib/docked-action-bar/docked-action-bar';
import bestPractices from './DockedActionBarBestPractices.md?raw';
import description from './DockedActionBarDescription.md?raw';

const meta: Meta<DockedActionBar> = {
  title: 'Components/Docked action bar',
  component: DockedActionBar,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DockedActionBarDefault.stories';
