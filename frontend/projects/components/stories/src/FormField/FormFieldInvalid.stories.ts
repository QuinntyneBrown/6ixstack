import type { StoryObj } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import { Input } from '../../../src/lib/form/input';

export const Invalid: StoryObj<FormField> = {
  render: () => ({
    moduleMetadata: { imports: [Input] },
    template: `<sx-form-field label="Event title" controlId="title-bad" error="Enter a title for the event."><input sx-input id="title-bad" aria-invalid="true" aria-describedby="title-bad-error" /></sx-form-field>`,
  }),
};
