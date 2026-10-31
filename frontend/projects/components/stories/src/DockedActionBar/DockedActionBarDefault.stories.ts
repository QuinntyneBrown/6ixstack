import type { StoryObj } from '@storybook/angular';
import { DockedActionBar } from '../../../src/lib/docked-action-bar/docked-action-bar';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<DockedActionBar> = {
  args: { title: 'Thu, Nov 5 · 9:00 AM', summary: '$49 · 318 going' },
  render: (args) => ({
    moduleMetadata: { imports: [Button] },
    props: args,
    template: `<div style="height: 12rem; overflow: auto"><p style="height: 20rem">Scroll…</p><sx-docked-action-bar [title]="title" [summary]="summary"><a slot="action" sx-button appearance="primary" href="#">Get tickets</a></sx-docked-action-bar></div>`,
  }),
};
