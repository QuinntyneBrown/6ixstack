import type { Meta } from '@storybook/angular';
import { SidebarNav } from '../../../src/lib/sidebar-nav/sidebar-nav';
import bestPractices from './SidebarNavBestPractices.md?raw';
import description from './SidebarNavDescription.md?raw';

const meta: Meta<SidebarNav> = {
  title: 'Components/SidebarNav',
  component: SidebarNav,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SidebarNavDefault.stories';
