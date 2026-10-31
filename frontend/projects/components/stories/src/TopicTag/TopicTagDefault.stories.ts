import type { StoryObj } from '@storybook/angular';
import { TopicTag } from '../../../src/lib/topics/topic-tag';

export const Default: StoryObj<TopicTag> = {
  args: { topic: 'ai' },
  render: (args) => ({
    props: args,
    template: `<sx-topic-tag [topic]="topic" />`,
  }),
};
