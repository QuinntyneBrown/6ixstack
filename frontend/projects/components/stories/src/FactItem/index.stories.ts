import type { Meta } from '@storybook/angular';
import { FactItem } from '../../../src/lib/fact-item/fact-item';
import bestPractices from './FactItemBestPractices.md?raw';
import description from './FactItemDescription.md?raw';

const meta: Meta<FactItem> = {
  title: 'Components/Fact item',
  component: FactItem,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './FactItemDefault.stories';
export { WithLink } from './FactItemWithLink.stories';
