import type { Meta } from '@storybook/angular';
import { SegmentedControl } from '../../../src/lib/segmented-control/segmented-control';
import bestPractices from './SegmentedControlBestPractices.md?raw';
import description from './SegmentedControlDescription.md?raw';

const meta: Meta<SegmentedControl> = {
  title: 'Components/Segmented control',
  component: SegmentedControl,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SegmentedControlDefault.stories';
export { CountsUnavailable } from './SegmentedControlCountsUnavailable.stories';
