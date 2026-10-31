import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';

export const Appearances: StoryObj<Button> = {
  render: () => ({
    template: `<div class="cluster"><button sx-button type="button" appearance="primary">Submit event</button><button sx-button type="button">Open the calendar</button><button sx-button type="button" appearance="ghost">Cancel</button><button sx-button type="button" appearance="link">Clear filters</button><button sx-button type="button" appearance="danger">Delete account</button><button sx-button type="button" appearance="ghost-danger">Cancel event</button></div>`,
  }),
};
