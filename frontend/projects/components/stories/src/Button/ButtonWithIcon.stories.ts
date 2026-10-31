import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';

export const WithIcon: StoryObj<Button> = {
  render: () => ({
    moduleMetadata: { imports: [Icon] },
    template: `<div class="cluster"><a sx-button appearance="primary" href="#"><sx-icon name="plus" />Submit event</a><button sx-button type="button" appearance="ghost" iconOnly aria-label="Open menu"><sx-icon name="menu" /></button></div>`,
  }),
};
