import type { StoryObj } from '@storybook/angular';
import { Description } from '../../../src/lib/description/description';

export const Default: StoryObj<Description> = {
  args: {
    text: 'A full day of Fabric and Azure OpenAI sessions. Read the [agenda](https://example.com/agenda).\n\n- Two tracks\n- Lunch included',
  },
  render: (args) => ({
    props: args,
    template: `<sx-description [text]="text" />`,
  }),
};
