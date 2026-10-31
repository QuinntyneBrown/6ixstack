import type { StoryObj } from '@storybook/angular';
import { TopicChip } from '../../../src/lib/topics/topic-chip';

export const Row: StoryObj<TopicChip> = {
  render: () => ({
    template: `<div class="cluster" role="group" aria-label="Topics"><button sx-topic-chip topic="ai" [pressed]="true">AI</button><button sx-topic-chip topic="dotnet">.NET</button><button sx-topic-chip topic="azure">Azure</button><button sx-topic-chip topic="angular">Angular</button><button sx-topic-chip topic="react">React</button><button sx-topic-chip topic="aws">AWS</button></div>`,
  }),
};
