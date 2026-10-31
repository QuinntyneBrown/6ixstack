import type { StoryObj } from '@storybook/angular';
import { InlineStatus } from '../../../src/lib/inline-status/inline-status';

export const Kinds: StoryObj<InlineStatus> = {
  render: () => ({
    template: `<div style="display:grid;gap:8px"><sx-inline-status>In review</sx-inline-status><sx-inline-status kind="warning">Needs changes</sx-inline-status><sx-inline-status kind="danger">Cancelled</sx-inline-status></div>`,
  }),
};
