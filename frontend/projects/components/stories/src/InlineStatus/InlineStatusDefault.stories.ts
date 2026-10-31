import type { StoryObj } from '@storybook/angular';
import { InlineStatus } from '../../../src/lib/inline-status/inline-status';

export const Default: StoryObj<InlineStatus> = {
  render: () => ({
    template: `<sx-inline-status kind="success">Published · 318 going · last edited Oct 28</sx-inline-status>`,
  }),
};
