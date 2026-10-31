import type { StoryObj } from '@storybook/angular';
import { EventMap } from '../../../src/lib/event-map/event-map';

export const Compact: StoryObj<EventMap> = {
  render: () => ({
    template: `<div style="max-width:500px"><sx-event-map compact [still]="true" [showTimeline]="false" hoveredSlug="a" heading="Living Arts Centre, Mississauga" subtitle="" [points]='[{slug:"a",title:"Azure Data & AI Day GTA",date:"2026-11-05",firstTopic:"ai",cardMeta:"Thu Nov 5 · 9:00 AM",latitude:43.5912,longitude:-79.6441,isHybrid:true},{slug:"b",title:"Bedrock in the real world",date:"2026-11-05",firstTopic:"aws",cardMeta:"Thu Nov 5 · 6:00 PM",latitude:43.6418,longitude:-79.3818,isHybrid:false}]' /></div>`,
  }),
};
