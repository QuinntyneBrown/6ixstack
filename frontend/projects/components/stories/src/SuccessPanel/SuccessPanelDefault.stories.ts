import type { StoryObj } from '@storybook/angular';
import { SuccessPanel } from '../../../src/lib/success-panel/success-panel';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<SuccessPanel> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<sx-success-panel title="Thanks — “Fabric for Power BI developers” is in review"><p>We sent a confirmation to <strong>priya@gtaazure.ca</strong>.</p><a slot="actions" sx-button appearance="primary" href="#">Back to events</a><button slot="actions" sx-button type="button">Submit another event</button></sx-success-panel>`,
  }),
};
