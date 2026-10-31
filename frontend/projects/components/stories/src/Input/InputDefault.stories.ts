import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const Default: StoryObj<Input> = {
  render: () => ({
    template: `<input sx-input aria-label="Event title" value="Azure Data & AI Day GTA" />`,
  }),
};
