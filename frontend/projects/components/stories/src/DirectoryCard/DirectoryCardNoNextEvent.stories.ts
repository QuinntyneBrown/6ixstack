import type { StoryObj } from '@storybook/angular';
import { DirectoryCard } from '../../../src/lib/directory-card/directory-card';

export const NoNextEvent: StoryObj<DirectoryCard> = {
  render: () => ({
    template: `<div style="max-width:20rem"><sx-directory-card initials="BD" name="Brampton Dev Night" link="/communities/brampton-dev-night" sub="Brampton · 640 members" description="A friendly monthly dev night." [topics]="['dotnet', 'angular']" /></div>`,
  }),
};
