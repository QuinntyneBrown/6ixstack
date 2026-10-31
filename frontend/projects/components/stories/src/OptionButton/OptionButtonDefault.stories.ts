import type { StoryObj } from '@storybook/angular';
import { OptionButton } from '../../../src/lib/option-button/option-button';

export const Default: StoryObj<OptionButton> = {
  args: { icon: 'calendar', hint: 'Opens a new tab', endIcon: 'external', busy: false },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 28rem"><a sx-option-button [icon]="icon" [hint]="hint" [endIcon]="endIcon" [busy]="busy" href="#">Google Calendar</a></div>`,
  }),
};
