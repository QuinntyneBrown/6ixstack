import type { StoryObj } from '@storybook/angular';
import { Choice } from '../../../src/lib/form/choice';
import { Check } from '../../../src/lib/form/choice';

export const Cards: StoryObj<Choice> = {
  render: () => ({
    moduleMetadata: { imports: [Check] },
    template: `<div class="stack"><label sx-choice card hint="At a venue in the GTA"><input sx-check type="radio" name="f" checked />In person</label><label sx-choice card hint="Online only"><input sx-check type="radio" name="f" />Streaming</label></div>`,
  }),
};
