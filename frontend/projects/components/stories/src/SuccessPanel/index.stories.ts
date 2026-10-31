import type { Meta } from '@storybook/angular';
import { SuccessPanel } from '../../../src/lib/success-panel/success-panel';
import bestPractices from './SuccessPanelBestPractices.md?raw';
import description from './SuccessPanelDescription.md?raw';

const meta: Meta<SuccessPanel> = {
  title: 'Components/SuccessPanel',
  component: SuccessPanel,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SuccessPanelDefault.stories';
