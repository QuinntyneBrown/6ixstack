import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const States: StoryObj<Input> = {
  render: () => ({
    template: `<div class="stack"><input sx-input aria-label="Invalid" aria-invalid="true" value="http://example.com" /><input sx-input aria-label="Disabled" disabled value="0.00" /></div>`,
  }),
};
