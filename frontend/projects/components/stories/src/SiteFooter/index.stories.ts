import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { SiteFooter } from '../../../src/lib/site-footer/site-footer';
import bestPractices from './SiteFooterBestPractices.md?raw';
import description from './SiteFooterDescription.md?raw';

const meta: Meta<SiteFooter> = {
  title: 'Components/Site footer',
  component: SiteFooter,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SiteFooterDefault.stories';
