import type { StoryObj } from '@storybook/angular';
import { FormSection } from '../../../src/lib/form/form-section';

export const Default: StoryObj<FormSection> = {
  render: () => ({
    template: `<sx-form-section title="Event basics" sectionId="basics" lead="This is what people see in the list."><p>Fields go here.</p></sx-form-section>`,
  }),
};
