import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { PersonLink } from '../../../src/lib/person/person-link';
import bestPractices from './PersonLinkBestPractices.md?raw';
import description from './PersonLinkDescription.md?raw';

const meta: Meta<PersonLink> = {
  title: 'Components/Person link',
  component: PersonLink,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './PersonLinkDefault.stories';
