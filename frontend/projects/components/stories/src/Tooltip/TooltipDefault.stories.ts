import type { StoryObj } from '@storybook/angular';
import { Tooltip } from '../../../src/lib/tooltip/tooltip';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';

export const Default: StoryObj<Tooltip> = {
  render: () => ({
    moduleMetadata: { imports: [Button, Icon] },
    template: `<div style="padding: 3rem;"><button sx-button appearance="ghost" iconOnly type="button" class="has-tooltip" aria-label="Notifications"><sx-icon name="bell" /><sx-tooltip>Notifications</sx-tooltip></button></div>`,
  }),
};
