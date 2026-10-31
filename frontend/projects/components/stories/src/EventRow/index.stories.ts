import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { EventRow } from '../../../src/lib/event-row/event-row';
import bestPractices from './EventRowBestPractices.md?raw';
import description from './EventRowDescription.md?raw';

const meta: Meta<EventRow> = {
  title: 'Components/Event row',
  component: EventRow,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './EventRowDefault.stories';
export { Streaming } from './EventRowStreaming.stories';
export { SoldOut } from './EventRowSoldOut.stories';
export { Cancelled } from './EventRowCancelled.stories';
