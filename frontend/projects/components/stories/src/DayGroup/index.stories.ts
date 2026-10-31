import type { Meta } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { DayGroup } from '../../../src/lib/day-group/day-group';
import bestPractices from './DayGroupBestPractices.md?raw';
import description from './DayGroupDescription.md?raw';

const meta: Meta<DayGroup> = {
  title: 'Components/Day group',
  component: DayGroup,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DayGroupDefault.stories';
