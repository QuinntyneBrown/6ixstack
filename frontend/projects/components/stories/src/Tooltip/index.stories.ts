import type { Meta } from '@storybook/angular';
import { Tooltip } from '../../../src/lib/tooltip/tooltip';
import bestPractices from './TooltipBestPractices.md?raw';
import description from './TooltipDescription.md?raw';

const meta: Meta<Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './TooltipDefault.stories';
