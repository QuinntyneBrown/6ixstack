import type { StoryObj } from '@storybook/angular';
import { SegmentedControl } from '../../../src/lib/segmented-control/segmented-control';

export const Default: StoryObj<SegmentedControl> = {
  render: () => ({
    props: {
      options: [
        { value: 'all', label: 'All', count: 14 },
        { value: 'gta', label: 'In the GTA', count: 9 },
        { value: 'streaming', label: 'Streaming', count: 7 },
      ],
      value: 'all',
    },
    template: `<sx-segmented-control label="Where" [options]="options" [value]="value" (valueChange)="value = $event" />`,
  }),
};
