import type { StoryObj } from '@storybook/angular';
import { DialogShell } from '../../../src/lib/dialog-shell/dialog-shell';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<DialogShell> = {
  args: { title: 'Add to my calendar', variant: 'modal' },
  render: (args) => ({
    moduleMetadata: { imports: [Button] },
    props: args,
    template: `<div style="max-width: 32rem"><sx-dialog-shell [title]="title" [variant]="variant"><p>Choose where to add Azure Data &amp; AI Day GTA.</p><button slot="footer" sx-button type="button">Cancel</button><button slot="footer" sx-button type="button" appearance="primary">Add</button></sx-dialog-shell></div>`,
  }),
};
