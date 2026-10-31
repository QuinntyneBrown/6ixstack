import type { StoryObj } from '@storybook/angular';
import { Badge } from '../../../src/lib/badge/badge';

export const Kinds: StoryObj<Badge> = {
  render: () => ({
    template: `<div class="cluster"><sx-badge>Draft</sx-badge><sx-badge kind="info">In review</sx-badge><sx-badge kind="success">Published</sx-badge><sx-badge kind="warning">Waitlist open</sx-badge><sx-badge kind="danger">Cancelled</sx-badge><sx-badge kind="brand">Featured</sx-badge><sx-badge kind="count">3</sx-badge></div>`,
  }),
};
