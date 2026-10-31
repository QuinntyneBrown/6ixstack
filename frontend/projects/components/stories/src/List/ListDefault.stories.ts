import type { StoryObj } from '@storybook/angular';
import { List } from '../../../src/lib/list/list';
import { ListItem } from '../../../src/lib/list/list';
import { LogoTile } from '../../../src/lib/logo-tile/logo-tile';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<List> = {
  render: () => ({
    moduleMetadata: { imports: [ListItem, LogoTile, Button] },
    template: `<ul sx-list><li sx-list-item title="Everything" meta="All GTA and streaming events · 14 in the next two weeks"><sx-logo-tile slot="leading" initials="E" /><button slot="actions" sx-button size="sm" type="button">Copy link</button></li><li sx-list-item title="In the GTA" meta="In-person and hybrid events only · 9 in the next two weeks"><sx-logo-tile slot="leading" initials="G" /><button slot="actions" sx-button size="sm" type="button">Copy link</button></li></ul>`,
  }),
};
