import type { StoryObj } from '@storybook/angular';
import { SidebarNav } from '../../../src/lib/sidebar-nav/sidebar-nav';

export const Default: StoryObj<SidebarNav> = {
  render: () => ({
    template: `<sx-sidebar-nav label="Settings sections" current="profile" [items]="[{label:'Profile',fragment:'profile'},{label:'Email notifications',fragment:'email-notifications'},{label:'Community',fragment:'community'}]" />`,
  }),
};
