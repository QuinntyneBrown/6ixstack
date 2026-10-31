import type { StoryObj } from '@storybook/angular';
import { EventMap } from '../../../src/lib/event-map/event-map';

export const Failed: StoryObj<EventMap> = {
  render: () => ({
    template: `<div style="max-width:500px"><sx-event-map [still]="true" [notice]="{ text: 'The map didn’t load. The list has every event.', icon: 'alert', action: 'Try again' }" /></div>`,
  }),
};
