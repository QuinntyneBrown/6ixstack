import type { StoryObj } from '@storybook/angular';
import { Switch } from '../../../src/lib/switch/switch';

export const Off: StoryObj<Switch> = {
  render: () => ({
    template: `<label sx-switch><input type="checkbox" role="switch" />Weekly summary of going and feed numbers</label>`,
  }),
};
