import type { Meta } from '@storybook/angular';
import { SearchField } from '../../../src/lib/search-field/search-field';
import bestPractices from './SearchFieldBestPractices.md?raw';
import description from './SearchFieldDescription.md?raw';

const meta: Meta<SearchField> = {
  title: 'Components/Search field',
  component: SearchField,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SearchFieldDefault.stories';
export { WithValue } from './SearchFieldWithValue.stories';
