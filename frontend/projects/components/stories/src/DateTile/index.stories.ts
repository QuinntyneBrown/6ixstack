import type { Meta } from '@storybook/angular';
import { DateTile } from '../../../src/lib/date-tile/date-tile';
import bestPractices from './DateTileBestPractices.md?raw';
import description from './DateTileDescription.md?raw';

const meta: Meta<DateTile> = {
  title: 'Components/Date tile',
  component: DateTile,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DateTileDefault.stories';
export { Large } from './DateTileLarge.stories';
