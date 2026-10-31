import type { StoryObj } from '@storybook/angular';
import { StatusPage } from '../../../src/lib/status-page/status-page';
import { Button } from '../../../src/lib/button/button';

export const ServerError: StoryObj<StatusPage> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<sx-status-page code="500" heading="Something went wrong on our side"><p slot="message">We've been notified. If it keeps happening, email hello@6ixstack.dev and mention Ref 7F3A-21C9.</p><ng-container slot="actions"><button sx-button type="button" appearance="primary">Try again</button></ng-container></sx-status-page>`,
  }),
};
