import type { StoryObj } from '@storybook/angular';
import { OptionButton } from '../../../src/lib/option-button/option-button';

export const Busy: StoryObj<OptionButton> = {
  render: () => ({
    template: `<div style="max-width: 28rem"><button sx-option-button type="button" icon="calendar" hint="Downloads an .ics file" busy>Apple Calendar</button></div>`,
  }),
};
