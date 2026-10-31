import type { StoryObj } from '@storybook/angular';
import { SearchField } from '../../../src/lib/search-field/search-field';

export const Default: StoryObj<SearchField> = {
  args: { label: 'Search events', placeholder: 'Search talks, groups, or neighbourhoods', value: '' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 24rem"><sx-search-field [label]="label" [placeholder]="placeholder" [value]="value" /></div>`,
  }),
};
