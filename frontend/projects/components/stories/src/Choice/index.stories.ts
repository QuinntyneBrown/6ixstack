import type { Meta } from '@storybook/angular';
import { Choice } from '../../../src/lib/form/choice';
import bestPractices from './ChoiceBestPractices.md?raw';
import description from './ChoiceDescription.md?raw';

const meta: Meta<Choice> = {
  title: 'Components/Choice',
  component: Choice,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ChoiceDefault.stories';
export { Radio } from './ChoiceRadio.stories';
export { Cards } from './ChoiceCards.stories';
