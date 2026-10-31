import type { StoryObj } from '@storybook/angular';
import { TopicTag } from '../../../src/lib/topics/topic-tag';

export const AllTopics: StoryObj<TopicTag> = {
  render: () => ({
    template: `<div class="cluster"><sx-topic-tag topic="ai" /><sx-topic-tag topic="dotnet" /><sx-topic-tag topic="azure" /><sx-topic-tag topic="angular" /><sx-topic-tag topic="react" /><sx-topic-tag topic="aws" /></div>`,
  }),
};
