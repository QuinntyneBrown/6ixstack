import type { StoryObj } from '@storybook/angular';
import { DirectoryCard } from '../../../src/lib/directory-card/directory-card';

export const Person: StoryObj<DirectoryCard> = {
  render: () => ({
    template: `<div style="max-width:20rem"><sx-directory-card variant="person" initials="PN" name="Priya Natarajan" link="/speakers/priya-natarajan" sub="Azure MVP · Cloud architect, Rogers" meta="Next: Keynote: Fabric one year later · Thu, Nov 5" [topics]="['ai', 'azure']" /></div>`,
  }),
};
