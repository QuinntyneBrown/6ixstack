import type { Meta } from '@storybook/angular';
import { TopicChip } from '../../../src/lib/topics/topic-chip';
import bestPractices from './TopicChipBestPractices.md?raw';
import description from './TopicChipDescription.md?raw';

const meta: Meta<TopicChip> = {
  title: 'Components/Topic chip',
  component: TopicChip,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './TopicChipDefault.stories';
export { Row } from './TopicChipRow.stories';
