import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';

export const Sizes: StoryObj<Button> = {
  render: () => ({
    template: `<div class="cluster"><button sx-button type="button" size="sm">Small</button><button sx-button type="button">Medium</button><button sx-button type="button" size="lg">Large</button></div>`,
  }),
};
