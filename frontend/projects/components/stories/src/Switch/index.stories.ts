import type { Meta } from '@storybook/angular';
import { Switch } from '../../../src/lib/switch/switch';
import bestPractices from './SwitchBestPractices.md?raw';
import description from './SwitchDescription.md?raw';

const meta: Meta<Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SwitchDefault.stories';
export { Off } from './SwitchOff.stories';
