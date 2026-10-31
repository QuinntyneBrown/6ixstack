import type { StoryObj } from '@storybook/angular';
import { SiteFooter } from '../../../src/lib/site-footer/site-footer';

export const Default: StoryObj<SiteFooter> = {
  render: () => ({
    props: {
      items: [
        { label: 'About', path: '/about' },
        { label: 'Code of conduct', path: '/code-of-conduct' },
        { label: 'Contact', path: '/contact' },
        { label: 'Calendar feeds', path: '/feeds' },
        { label: 'Organizer sign in', path: '/sign-in' },
      ],
    },
    template: `<sx-site-footer [items]="items" />`,
  }),
};
