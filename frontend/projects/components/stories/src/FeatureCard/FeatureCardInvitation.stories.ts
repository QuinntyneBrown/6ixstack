import type { StoryObj } from '@storybook/angular';
import { FeatureCard } from '../../../src/lib/feature-card/feature-card';

export const Invitation: StoryObj<FeatureCard> = {
  render: () => ({
    template: `<div style="max-width:28rem"><sx-feature-card /></div>`,
  }),
};
