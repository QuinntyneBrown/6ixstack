import type { Meta } from '@storybook/angular';
import { EventMap } from '../../../src/lib/event-map/event-map';
import bestPractices from './EventMapBestPractices.md?raw';
import description from './EventMapDescription.md?raw';

const meta: Meta<EventMap> = {
  title: 'Components/EventMap',
  component: EventMap,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './EventMapDefault.stories';
export { Hovered } from './EventMapHovered.stories';
export { DayFocus } from './EventMapDayFocus.stories';
export { Compact } from './EventMapCompact.stories';
export { Failed } from './EventMapFailed.stories';
