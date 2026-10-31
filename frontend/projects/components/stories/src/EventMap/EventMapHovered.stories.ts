import type { StoryObj } from '@storybook/angular';
import { EventMap } from '../../../src/lib/event-map/event-map';

export const Hovered: StoryObj<EventMap> = {
  render: () => ({
    template: `<div style="max-width:500px"><sx-event-map [still]="true" hoveredSlug="a" [points]='[{slug:"a",title:"Azure Data & AI Day GTA",date:"2026-11-05",firstTopic:"ai",cardMeta:"Thu Nov 5 · 9:00 AM",latitude:43.5912,longitude:-79.6441,isHybrid:true},{slug:"b",title:"Bedrock in the real world",date:"2026-11-05",firstTopic:"aws",cardMeta:"Thu Nov 5 · 6:00 PM",latitude:43.6418,longitude:-79.3818,isHybrid:false}]' [streams]='[{slug:"s",title:".NET Aspire deep dive",date:"2026-11-06",firstTopic:"dotnet",cardMeta:"Fri Nov 6 · 11:00 AM",originCity:"London",originSide:"east",sourceTime:"4:00 PM GMT"}]' [days]='[{date:"2026-11-05",weekdayLetter:"T",dayOfMonth:5,label:"Thursday, November 5",count:2,dots:[{topic:"ai",isStream:false},{topic:"aws",isStream:false}]},{date:"2026-11-06",weekdayLetter:"F",dayOfMonth:6,label:"Friday, November 6",count:1,dots:[{topic:"dotnet",isStream:true}]},{date:"2026-11-07",weekdayLetter:"S",dayOfMonth:7,label:"Saturday, November 7",count:0,dots:[]}]' /></div>`,
  }),
};
