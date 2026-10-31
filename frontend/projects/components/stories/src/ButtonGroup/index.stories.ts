import type { Meta } from '@storybook/angular';
import { ButtonGroup } from '../../../src/lib/button-group/button-group';
import bestPractices from './ButtonGroupBestPractices.md?raw';
import description from './ButtonGroupDescription.md?raw';

const meta: Meta<ButtonGroup> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ButtonGroupDefault.stories';
