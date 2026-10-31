import type { StoryObj } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import { Input } from '../../../src/lib/form/input';

export const Optional: StoryObj<FormField> = {
  render: () => ({
    moduleMetadata: { imports: [Input] },
    template: `<sx-form-field label="Livestream link" controlId="stream" optional hint="Shown 15 minutes before start."><input sx-input id="stream" type="url" placeholder="https://" aria-describedby="stream-help" /></sx-form-field>`,
  }),
};
