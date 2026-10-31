import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { MonthGrid } from '../../../src/lib/calendar/month-grid';
import bestPractices from './MonthGridBestPractices.md?raw';
import description from './MonthGridDescription.md?raw';

const meta: Meta<MonthGrid> = {
  title: 'Components/MonthGrid',
  component: MonthGrid,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './MonthGridDefault.stories';
export { Loading } from './MonthGridLoading.stories';
export { Empty } from './MonthGridEmpty.stories';
