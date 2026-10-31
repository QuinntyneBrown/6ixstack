import { NavItem } from 'components';

/** Primary routes, shared by the header and the phone menu so the two cannot drift (app-shell design). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Events', path: '/', exact: true },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Communities', path: '/communities' },
  { label: 'Speakers', path: '/speakers' },
];

/** Secondary destinations in the phone menu. */
export const MORE_ITEMS: NavItem[] = [
  { label: 'Calendar feeds', path: '/feeds', icon: 'rss' },
  { label: 'Organizer sign in', path: '/sign-in', icon: 'user' },
];

export const FOOTER_ITEMS: NavItem[] = [
  { label: 'About', path: '/about' },
  { label: 'Code of conduct', path: '/code-of-conduct' },
  { label: 'Contact', path: '/contact' },
  { label: 'Calendar feeds', path: '/feeds' },
  { label: 'Organizer sign in', path: '/sign-in' },
];
