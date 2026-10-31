import type { Meta } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import bestPractices from './FormFieldBestPractices.md?raw';
import description from './FormFieldDescription.md?raw';

const meta: Meta<FormField> = {
  title: 'Components/FormField',
  component: FormField,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './FormFieldDefault.stories';
export { Invalid } from './FormFieldInvalid.stories';
export { Optional } from './FormFieldOptional.stories';
