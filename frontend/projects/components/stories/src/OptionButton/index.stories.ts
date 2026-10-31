import type { Meta } from '@storybook/angular';
import { OptionButton } from '../../../src/lib/option-button/option-button';
import bestPractices from './OptionButtonBestPractices.md?raw';
import description from './OptionButtonDescription.md?raw';

const meta: Meta<OptionButton> = {
  title: 'Components/Option button',
  component: OptionButton,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './OptionButtonDefault.stories';
export { Busy } from './OptionButtonBusy.stories';
