import type { StoryObj } from '@storybook/angular';
import { FieldSet } from '../../../src/lib/form/field-set';
import { Check, Choice } from '../../../src/lib/form/choice';

export const Default: StoryObj<FieldSet> = {
  render: () => ({
    moduleMetadata: { imports: [Check, Choice] },
    template: `<sx-field-set legend="Topics" controlId="topics"><label sx-choice><input sx-check type="checkbox" />AI</label><label sx-choice><input sx-check type="checkbox" />.NET</label></sx-field-set>`,
  }),
};
