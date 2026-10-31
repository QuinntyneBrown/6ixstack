import type { StoryObj } from '@storybook/angular';
import { Stat } from '../../../src/lib/stat/stat';
import { StatsRow } from '../../../src/lib/stat/stat';

export const Default: StoryObj<Stat> = {
  render: () => ({
    moduleMetadata: { imports: [StatsRow] },
    template: `<sx-stats-row><sx-stat label="Upcoming" value="1" /><sx-stat label="In review" value="1" /><sx-stat label="Going" value="318" /><sx-stat label="Feed subscribers" value="1,204" /></sx-stats-row>`,
  }),
};
