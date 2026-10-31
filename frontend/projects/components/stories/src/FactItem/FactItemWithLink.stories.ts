import type { StoryObj } from '@storybook/angular';
import { FactItem } from '../../../src/lib/fact-item/fact-item';

export const WithLink: StoryObj<FactItem> = {
  render: () => ({
    template: `<sx-fact-item icon="pin" label="Living Arts Centre">4141 Living Arts Dr, Mississauga · <a href="#">Directions</a></sx-fact-item>`,
  }),
};
