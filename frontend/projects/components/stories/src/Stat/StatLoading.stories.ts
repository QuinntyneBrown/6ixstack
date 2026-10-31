import type { StoryObj } from '@storybook/angular';
import { Stat } from '../../../src/lib/stat/stat';
import { StatsRow } from '../../../src/lib/stat/stat';

export const Loading: StoryObj<Stat> = {
  render: () => ({
    moduleMetadata: { imports: [StatsRow] },
    template: `<sx-stats-row><sx-stat label="Upcoming" [loading]="true" /><sx-stat label="In review" [loading]="true" /></sx-stats-row>`,
  }),
};
