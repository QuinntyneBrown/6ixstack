import type { Meta } from '@storybook/angular';
import { ErrorSummary } from '../../../src/lib/form/error-summary';
import bestPractices from './ErrorSummaryBestPractices.md?raw';
import description from './ErrorSummaryDescription.md?raw';

const meta: Meta<ErrorSummary> = {
  title: 'Components/ErrorSummary',
  component: ErrorSummary,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ErrorSummaryDefault.stories';
export { OneError } from './ErrorSummaryOneError.stories';
