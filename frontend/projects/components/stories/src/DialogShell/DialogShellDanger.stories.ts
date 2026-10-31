import type { StoryObj } from '@storybook/angular';
import { DialogShell } from '../../../src/lib/dialog-shell/dialog-shell';
import { Button } from '../../../src/lib/button/button';

export const Danger: StoryObj<DialogShell> = {
  args: { title: 'Cancel “Azure Data & AI Day GTA”?', tone: 'danger' },
  render: (args) => ({
    moduleMetadata: { imports: [Button] },
    props: args,
    template: `<div style="max-width: 32rem"><sx-dialog-shell [title]="title" [tone]="tone"><p slot="description">It stays on 6ixstack marked as cancelled, ticket links are removed and feeds update. This can’t be undone.</p><p>Reason for attendees…</p><button slot="footer" sx-button type="button">Keep event</button><button slot="footer" sx-button type="button" appearance="danger">Cancel event</button></sx-dialog-shell></div>`,
  }),
};
