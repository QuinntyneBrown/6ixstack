import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const Select: StoryObj<Input> = {
  render: () => ({
    template: `<select sx-input aria-label="City"><option>Toronto</option><option>Mississauga</option></select>`,
  }),
};
