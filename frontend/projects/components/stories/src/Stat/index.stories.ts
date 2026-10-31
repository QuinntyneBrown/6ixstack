import type { Meta } from '@storybook/angular';
import { Stat } from '../../../src/lib/stat/stat';
import bestPractices from './StatBestPractices.md?raw';
import description from './StatDescription.md?raw';

const meta: Meta<Stat> = {
  title: 'Components/Stat',
  component: Stat,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './StatDefault.stories';
export { Loading } from './StatLoading.stories';
