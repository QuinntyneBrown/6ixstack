import type { Meta } from '@storybook/angular';
import { Avatar } from '../../../src/lib/avatar/avatar';
import bestPractices from './AvatarBestPractices.md?raw';
import description from './AvatarDescription.md?raw';

const meta: Meta<Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './AvatarDefault.stories';
export { Sizes } from './AvatarSizes.stories';
