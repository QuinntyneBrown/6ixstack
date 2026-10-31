import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Toast } from '../../../src/lib/toast/toast';
import { ToastPlayground } from './ToastPlayground';

export const Playground: StoryObj<Toast> = {
  decorators: [moduleMetadata({ imports: [ToastPlayground] })],
  render: () => ({ template: `<sx-toast-playground />` }),
};
