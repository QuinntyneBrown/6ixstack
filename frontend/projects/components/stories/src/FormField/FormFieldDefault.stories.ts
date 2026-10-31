import type { StoryObj } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import { Input } from '../../../src/lib/form/input';

export const Default: StoryObj<FormField> = {
  render: () => ({
    moduleMetadata: { imports: [Input] },
    template: `<sx-form-field label="Event title" controlId="title" hint="Up to 90 characters. Say what people will learn."><input sx-input id="title" aria-describedby="title-help" /></sx-form-field>`,
  }),
};
