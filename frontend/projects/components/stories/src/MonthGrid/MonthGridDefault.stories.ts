import type { StoryObj } from '@storybook/angular';
import { MonthGrid } from '../../../src/lib/calendar/month-grid';

export const Default: StoryObj<MonthGrid> = {
  render: () => ({
    props: {
      days: {
        '2026-11-04': [
          {
            title: 'Azure AI Foundry: shipping agents to production',
            link: '/events/azure-ai-foundry-shipping-agents',
            topic: 'ai',
          },
          { title: 'Signals all the way down', link: '/events/signals-all-the-way-down', topic: 'angular' },
        ],
        '2026-11-05': [
          { title: 'Azure Data & AI Day GTA', link: '/', topic: 'azure' },
          { title: 'Bedrock in the real world', link: '/', topic: 'aws' },
          { title: 'Signals all the way down', link: '/', topic: 'angular' },
          { title: 'RAG evaluation workshop', link: '/', topic: 'ai' },
        ],
      },
    },
    template: `<sx-month-grid month="2026-11" label="November 2026" today="2026-11-02" [days]="days" />`,
  }),
};
