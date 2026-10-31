import type { StoryObj } from '@storybook/angular';
import { SegmentedControl } from '../../../src/lib/segmented-control/segmented-control';

export const CountsUnavailable: StoryObj<SegmentedControl> = {
  render: () => ({
    props: {
      options: [
        { value: 'all', label: 'All', count: '–' },
        { value: 'gta', label: 'In the GTA', count: '–' },
        { value: 'streaming', label: 'Streaming', count: '–' },
      ],
    },
    template: `<sx-segmented-control label="Where" [options]="options" value="all" />`,
  }),
};
