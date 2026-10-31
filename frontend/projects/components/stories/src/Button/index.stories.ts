import type { Meta } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import bestPractices from './ButtonBestPractices.md?raw';
import description from './ButtonDescription.md?raw';

const meta: Meta<Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ButtonDefault.stories';
export { Appearances } from './ButtonAppearances.stories';
export { Sizes } from './ButtonSizes.stories';
export { WithIcon } from './ButtonWithIcon.stories';
export { Busy } from './ButtonBusy.stories';
