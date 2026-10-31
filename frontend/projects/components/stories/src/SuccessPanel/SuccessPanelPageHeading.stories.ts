import type { StoryObj } from '@storybook/angular';
import { SuccessPanel } from '../../../src/lib/success-panel/success-panel';
import { Button } from '../../../src/lib/button/button';

export const PageHeading: StoryObj<SuccessPanel> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<sx-success-panel icon="mail" [headingLevel]="1" title="Check your inbox"><p>We sent a sign-in link to <strong>priya@gtaazure.ca</strong>. It works once and expires in 15 minutes.</p><button slot="actions" sx-button type="button" disabled>Resend link in 30s</button></sx-success-panel>`,
  }),
};
