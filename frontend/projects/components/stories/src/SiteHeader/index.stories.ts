import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { SiteHeader } from '../../../src/lib/site-header/site-header';
import bestPractices from './SiteHeaderBestPractices.md?raw';
import description from './SiteHeaderDescription.md?raw';

const meta: Meta<SiteHeader> = {
  title: 'Components/Site header',
  component: SiteHeader,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SiteHeaderDefault.stories';
export { WithoutSubmit } from './SiteHeaderWithoutSubmit.stories';
