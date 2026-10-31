import type { Meta } from '@storybook/angular';
import { Alert } from '../../../src/lib/alert/alert';
import bestPractices from './AlertBestPractices.md?raw';
import description from './AlertDescription.md?raw';

const meta: Meta<Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './AlertDefault.stories';
export { Kinds } from './AlertKinds.stories';
export { SiteBanner } from './AlertSiteBanner.stories';
