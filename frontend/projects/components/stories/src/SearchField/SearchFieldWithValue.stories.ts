import type { StoryObj } from '@storybook/angular';
import { SearchField } from '../../../src/lib/search-field/search-field';

export const WithValue: StoryObj<SearchField> = {
  render: () => ({
    template: `<div style="max-width: 24rem"><sx-search-field label="Search events" value="Kubernetes" /></div>`,
  }),
};
