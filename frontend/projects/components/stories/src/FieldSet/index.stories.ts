import type { Meta } from '@storybook/angular';
import { FieldSet } from '../../../src/lib/form/field-set';
import bestPractices from './FieldSetBestPractices.md?raw';
import description from './FieldSetDescription.md?raw';

const meta: Meta<FieldSet> = {
  title: 'Components/FieldSet',
  component: FieldSet,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './FieldSetDefault.stories';
export { Invalid } from './FieldSetInvalid.stories';
