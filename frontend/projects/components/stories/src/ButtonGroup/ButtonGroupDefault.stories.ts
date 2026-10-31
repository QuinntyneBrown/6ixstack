import type { StoryObj } from '@storybook/angular';
import { ButtonGroup } from '../../../src/lib/button-group/button-group';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<ButtonGroup> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<sx-button-group label="View"><button sx-button size="sm" type="button">List</button><button sx-button size="sm" type="button" aria-pressed="true">Month</button></sx-button-group>`,
  }),
};
