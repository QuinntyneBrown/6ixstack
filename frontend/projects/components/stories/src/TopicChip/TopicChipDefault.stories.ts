import type { StoryObj } from '@storybook/angular';
import { TopicChip } from '../../../src/lib/topics/topic-chip';

export const Default: StoryObj<TopicChip> = {
  args: { topic: 'ai', pressed: false },
  render: (args) => ({
    props: args,
    template: `<button sx-topic-chip [topic]="topic" [pressed]="pressed" (click)="pressed = !pressed">{{ topic }}</button>`,
  }),
};
