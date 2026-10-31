import type { Meta } from '@storybook/angular';
import { LogoTile } from '../../../src/lib/logo-tile/logo-tile';
import bestPractices from './LogoTileBestPractices.md?raw';
import description from './LogoTileDescription.md?raw';

const meta: Meta<LogoTile> = {
  title: 'Components/LogoTile',
  component: LogoTile,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './LogoTileDefault.stories';
export { Large } from './LogoTileLarge.stories';
