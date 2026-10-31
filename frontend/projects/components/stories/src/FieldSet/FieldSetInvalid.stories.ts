import type { StoryObj } from '@storybook/angular';
import { FieldSet } from '../../../src/lib/form/field-set';
import { Check, Choice } from '../../../src/lib/form/choice';

export const Invalid: StoryObj<FieldSet> = {
  render: () => ({
    moduleMetadata: { imports: [Check, Choice] },
    template: `<sx-field-set legend="Topics" controlId="topics-bad" error="Pick at least one topic so people can find it."><label sx-choice><input sx-check type="checkbox" aria-invalid="true" aria-describedby="topics-bad-error" />AI</label></sx-field-set>`,
  }),
};
