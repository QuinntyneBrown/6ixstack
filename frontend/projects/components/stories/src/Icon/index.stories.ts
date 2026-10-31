import type { Meta } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';
import bestPractices from './IconBestPractices.md?raw';
import description from './IconDescription.md?raw';

const meta: Meta<Icon> = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './IconDefault.stories';
export { Labelled } from './IconLabelled.stories';
export { Sizes } from './IconSizes.stories';
