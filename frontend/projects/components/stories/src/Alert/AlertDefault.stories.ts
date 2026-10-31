import type { StoryObj } from '@storybook/angular';
import { Alert } from '../../../src/lib/alert/alert';

export const Default: StoryObj<Alert> = {
  args: { kind: 'info', title: 'Times are in Toronto time (ET)' },
  render: (args) => ({
    props: args,
    template: `<sx-alert [kind]="kind" [title]="title">Streams also show the time where they're hosted.</sx-alert>`,
  }),
};
