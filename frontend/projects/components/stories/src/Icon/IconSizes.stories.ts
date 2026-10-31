import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';

export const Sizes: StoryObj<Icon> = {
  render: () => ({
    template: `<div style="display: flex; gap: 1rem; align-items: center">
      <sx-icon name="pin" size="sm" /><sx-icon name="pin" /><sx-icon name="pin" size="lg" />
    </div>`,
  }),
};
