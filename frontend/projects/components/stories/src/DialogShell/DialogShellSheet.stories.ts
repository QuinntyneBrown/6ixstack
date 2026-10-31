import type { StoryObj } from '@storybook/angular';
import { DialogShell } from '../../../src/lib/dialog-shell/dialog-shell';

export const Sheet: StoryObj<DialogShell> = {
  render: () => ({
    template: `<div style="max-width: 22.5rem"><sx-dialog-shell title="Menu" variant="sheet"><p>Bottom sheet on phones.</p></sx-dialog-shell></div>`,
  }),
};
