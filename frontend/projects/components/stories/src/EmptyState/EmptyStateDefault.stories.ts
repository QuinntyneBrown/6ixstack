import type { StoryObj } from '@storybook/angular';
import { EmptyState } from '../../../src/lib/empty-state/empty-state';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<EmptyState> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<sx-empty-state icon="calendar" title="No events in the next two weeks"><span slot="text">It's a quiet stretch. Organizers post new meetups every week, so check back soon.</span><ng-container slot="actions"><a sx-button appearance="primary" href="#">Submit an event</a><a sx-button href="#">Browse the calendar</a></ng-container></sx-empty-state>`,
  }),
};
