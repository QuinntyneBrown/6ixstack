import type { StoryObj } from '@storybook/angular';
import { EmptyState } from '../../../src/lib/empty-state/empty-state';
import { Button } from '../../../src/lib/button/button';

export const NoResults: StoryObj<EmptyState> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<sx-empty-state icon="search-x" title="No events match those filters"><span slot="text">Try another topic, or include streaming events.</span><ng-container slot="actions"><button sx-button appearance="primary" type="button">Clear filters</button><a sx-button href="#">Get a feed for Kubernetes</a></ng-container></sx-empty-state>`,
  }),
};
