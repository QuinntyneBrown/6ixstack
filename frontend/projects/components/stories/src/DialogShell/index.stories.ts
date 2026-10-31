import type { Meta } from '@storybook/angular';
import { DialogShell } from '../../../src/lib/dialog-shell/dialog-shell';
import bestPractices from './DialogShellBestPractices.md?raw';
import description from './DialogShellDescription.md?raw';

const meta: Meta<DialogShell> = {
  title: 'Components/Dialog shell',
  component: DialogShell,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DialogShellDefault.stories';
export { Sheet } from './DialogShellSheet.stories';
