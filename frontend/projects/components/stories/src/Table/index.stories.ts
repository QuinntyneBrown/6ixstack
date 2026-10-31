import type { Meta } from '@storybook/angular';
import { Table } from '../../../src/lib/table/table';
import bestPractices from './TableBestPractices.md?raw';
import description from './TableDescription.md?raw';

const meta: Meta<Table> = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './TableDefault.stories';
