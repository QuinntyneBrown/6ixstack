import type { StoryObj } from '@storybook/angular';
import { Description } from '../../../src/lib/description/description';

export const UnsafeLinksStayText: StoryObj<Description> = {
  render: () => ({
    template: `<sx-description text="[click me](javascript:alert(1)) and <b>bold</b> stay as text." />`,
  }),
};
