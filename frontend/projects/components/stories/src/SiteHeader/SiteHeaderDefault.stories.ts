import type { StoryObj } from '@storybook/angular';
import { SiteHeader } from '../../../src/lib/site-header/site-header';

export const Default: StoryObj<SiteHeader> = {
  render: () => ({
    props: {
      items: [
        { label: 'Events', path: '/', exact: true },
        { label: 'Calendar', path: '/calendar' },
        { label: 'Communities', path: '/communities' },
        { label: 'Speakers', path: '/speakers' },
      ],
    },
    template: `<sx-site-header [items]="items" />`,
  }),
};
