import type { StoryObj } from '@storybook/angular';
import { StatusPage } from '../../../src/lib/status-page/status-page';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<StatusPage> = {
  args: { code: '404', heading: "We can't find that page" },
  render: (args) => ({
    moduleMetadata: { imports: [Button] },
    props: args,
    template: `<sx-status-page [code]="code" [heading]="heading"><p slot="message">The event may have been removed by its organizer, or the link has a typo.</p><ng-container slot="actions"><a sx-button appearance="primary" href="#">Browse events</a><a sx-button href="#">Open the calendar</a></ng-container></sx-status-page>`,
  }),
};
