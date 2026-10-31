import type { StoryObj } from '@storybook/angular';
import { Switch } from '../../../src/lib/switch/switch';

export const Default: StoryObj<Switch> = {
  render: () => ({
    template: `<label sx-switch><input type="checkbox" role="switch" checked />My event is approved or needs changes</label>`,
  }),
};
