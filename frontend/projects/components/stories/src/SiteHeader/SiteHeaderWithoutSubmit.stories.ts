import type { StoryObj } from '@storybook/angular';
import { SiteHeader } from '../../../src/lib/site-header/site-header';

export const WithoutSubmit: StoryObj<SiteHeader> = {
  render: () => ({
    props: {
      items: [
        { label: 'Events', path: '/', exact: true },
        { label: 'Calendar', path: '/calendar' },
      ],
    },
    template: `<sx-site-header [items]="items" [showSubmit]="false" />`,
  }),
};
