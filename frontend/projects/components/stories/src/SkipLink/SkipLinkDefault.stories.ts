import type { StoryObj } from '@storybook/angular';
import { SkipLink } from '../../../src/lib/skip-link/skip-link';

export const Default: StoryObj<SkipLink> = {
  args: { target: 'story-main' },
  render: (args) => ({
    props: args,
    template: `<sx-skip-link [target]="target" /><p>Press Tab to reveal the skip link.</p><div id="story-main" style="margin-top: 2rem">Main content</div>`,
  }),
};
