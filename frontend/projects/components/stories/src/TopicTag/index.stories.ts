import type { Meta } from '@storybook/angular';
import { TopicTag } from '../../../src/lib/topics/topic-tag';
import bestPractices from './TopicTagBestPractices.md?raw';
import description from './TopicTagDescription.md?raw';

const meta: Meta<TopicTag> = {
  title: 'Components/Topic tag',
  component: TopicTag,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './TopicTagDefault.stories';
export { AllTopics } from './TopicTagAllTopics.stories';
