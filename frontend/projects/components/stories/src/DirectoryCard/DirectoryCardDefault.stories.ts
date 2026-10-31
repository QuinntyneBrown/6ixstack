import type { StoryObj } from '@storybook/angular';
import { DirectoryCard } from '../../../src/lib/directory-card/directory-card';

export const Default: StoryObj<DirectoryCard> = {
  render: () => ({
    template: `<div style="max-width:20rem"><sx-directory-card initials="GA" name="GTA Azure Community" link="/communities/gta-azure-community" sub="Mississauga · 2,140 members" description="Monthly Azure talks and an annual data & AI day, run by local MVPs since 2019." meta="Next: Azure Data & AI Day GTA · Thu, Nov 5" [topics]="['ai', 'azure']" /></div>`,
  }),
};
