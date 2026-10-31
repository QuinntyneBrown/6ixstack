import type { StoryObj } from '@storybook/angular';
import { Table } from '../../../src/lib/table/table';

export const Default: StoryObj<Table> = {
  render: () => ({
    template: `<sx-table><table class="table"><thead><tr><th scope="col">Event</th><th scope="col" aria-sort="ascending"><button type="button">Date</button></th><th scope="col" class="num">Going</th></tr></thead><tbody><tr><td>Azure Data & AI Day GTA</td><td>Thu, Nov 5 · 9:00 AM</td><td class="num">318</td></tr><tr><td>Fabric for Power BI developers</td><td>Wed, Nov 18 · 6:30 PM</td><td class="num">–</td></tr></tbody></table></sx-table>`,
  }),
};
