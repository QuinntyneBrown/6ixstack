import type { Meta } from '@storybook/angular';
import { StatusPage } from '../../../src/lib/status-page/status-page';
import bestPractices from './StatusPageBestPractices.md?raw';
import description from './StatusPageDescription.md?raw';

const meta: Meta<StatusPage> = {
  title: 'Components/Status page',
  component: StatusPage,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './StatusPageDefault.stories';
export { ServerError } from './StatusPageServerError.stories';
