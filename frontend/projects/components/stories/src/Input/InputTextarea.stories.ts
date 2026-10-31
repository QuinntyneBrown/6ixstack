import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const Textarea: StoryObj<Input> = {
  render: () => ({
    template: `<textarea sx-input aria-label="Description" rows="4">Move your Power BI reports onto Fabric.</textarea>`,
  }),
};
