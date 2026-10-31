import type { StoryObj } from '@storybook/angular';
import { Choice } from '../../../src/lib/form/choice';
import { Check } from '../../../src/lib/form/choice';

export const Default: StoryObj<Choice> = {
  render: () => ({
    moduleMetadata: { imports: [Check] },
    template: `<label sx-choice><input sx-check type="checkbox" checked />AI</label>`,
  }),
};
