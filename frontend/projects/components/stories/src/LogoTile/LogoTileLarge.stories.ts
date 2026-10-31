import type { StoryObj } from '@storybook/angular';
import { LogoTile } from '../../../src/lib/logo-tile/logo-tile';

export const Large: StoryObj<LogoTile> = {
  render: () => ({
    template: `<sx-logo-tile initials="GA" size="lg" />`,
  }),
};
