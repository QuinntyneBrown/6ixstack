import type { Meta } from '@storybook/angular';
import { DirectoryCard } from '../../../src/lib/directory-card/directory-card';
import bestPractices from './DirectoryCardBestPractices.md?raw';
import description from './DirectoryCardDescription.md?raw';

const meta: Meta<DirectoryCard> = {
  title: 'Components/DirectoryCard',
  component: DirectoryCard,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DirectoryCardDefault.stories';
export { NoNextEvent } from './DirectoryCardNoNextEvent.stories';
