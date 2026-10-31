import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';

export const Busy: StoryObj<Button> = {
  render: () => ({
    template: `<button sx-button type="button" appearance="primary" busy>Sending link</button>`,
  }),
};
