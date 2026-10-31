import type { Meta } from '@storybook/angular';
import { Description } from '../../../src/lib/description/description';
import bestPractices from './DescriptionBestPractices.md?raw';
import description from './DescriptionDescription.md?raw';

const meta: Meta<Description> = {
  title: 'Components/Description',
  component: Description,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DescriptionDefault.stories';
export { UnsafeLinksStayText } from './DescriptionUnsafeLinksStayText.stories';
