import type { Meta } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';
import bestPractices from './InputBestPractices.md?raw';
import description from './InputDescription.md?raw';

const meta: Meta<Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './InputDefault.stories';
export { Textarea } from './InputTextarea.stories';
export { Select } from './InputSelect.stories';
export { States } from './InputStates.stories';
