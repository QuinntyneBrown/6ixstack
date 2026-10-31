import type { Meta } from '@storybook/angular';
import { List } from '../../../src/lib/list/list';
import bestPractices from './ListBestPractices.md?raw';
import description from './ListDescription.md?raw';

const meta: Meta<List> = {
  title: 'Components/List',
  component: List,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ListDefault.stories';
