import type { Meta } from '@storybook/angular';
import { Toast } from '../../../src/lib/toast/toast';
import bestPractices from './ToastBestPractices.md?raw';
import description from './ToastDescription.md?raw';

const meta: Meta<Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ToastDefault.stories';
export { Kinds } from './ToastKinds.stories';
export { Playground } from './ToastPlayground.stories';
