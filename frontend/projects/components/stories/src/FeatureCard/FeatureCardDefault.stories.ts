import type { StoryObj } from '@storybook/angular';
import { FeatureCard } from '../../../src/lib/feature-card/feature-card';

export const Default: StoryObj<FeatureCard> = {
  render: () => ({
    template: `<div style="max-width:28rem"><sx-feature-card [event]='{slug:"azure-data-ai-day-gta",title:"Azure Data & AI Day GTA",organizer:"GTA Azure Community",description:"A full day of Fabric, Azure OpenAI and data platform sessions from local MVPs, with a hands-on lab track.",monthLabel:"Nov",dayOfMonth:"5",locationLabel:"Living Arts Centre, Mississauga",hasLivestream:true,whenLabel:"Thu · 9:00 AM",primaryAction:{label:"Get tickets · $49",url:"/events/azure-data-ai-day-gta"}}' /></div>`,
  }),
};
