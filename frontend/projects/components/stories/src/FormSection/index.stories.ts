import type { Meta } from '@storybook/angular';
import { FormSection } from '../../../src/lib/form/form-section';
import bestPractices from './FormSectionBestPractices.md?raw';
import description from './FormSectionDescription.md?raw';

const meta: Meta<FormSection> = {
  title: 'Components/FormSection',
  component: FormSection,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './FormSectionDefault.stories';
