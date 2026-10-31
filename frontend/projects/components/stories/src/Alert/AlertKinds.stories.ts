import type { StoryObj } from '@storybook/angular';
import { Alert } from '../../../src/lib/alert/alert';

export const Kinds: StoryObj<Alert> = {
  render: () => ({
    template: `<div class="stack"><sx-alert kind="info" title="6ixstack was updated">Refresh to get the newest events and fixes.</sx-alert><sx-alert kind="success" title="You're back online" dismissible>Events are up to date as of 10:14 AM.</sx-alert><sx-alert kind="warning" title="You're offline" role="status">Submitting and feeds need a connection.</sx-alert><sx-alert kind="danger" title="We couldn't load events" role="alert">6ixstack didn't respond in time. Your filters are kept.</sx-alert></div>`,
  }),
};
