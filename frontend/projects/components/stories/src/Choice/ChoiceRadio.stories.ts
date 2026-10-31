import type { StoryObj } from '@storybook/angular';
import { Choice } from '../../../src/lib/form/choice';
import { Check } from '../../../src/lib/form/choice';

export const Radio: StoryObj<Choice> = {
  render: () => ({
    moduleMetadata: { imports: [Check] },
    template: `<div class="cluster"><label sx-choice><input sx-check type="radio" name="p" checked />Free</label><label sx-choice><input sx-check type="radio" name="p" />Paid</label></div>`,
  }),
};
