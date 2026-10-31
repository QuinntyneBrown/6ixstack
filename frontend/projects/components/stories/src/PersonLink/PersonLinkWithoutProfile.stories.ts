import type { StoryObj } from '@storybook/angular';
import { PersonLink } from '../../../src/lib/person/person-link';

export const WithoutProfile: StoryObj<PersonLink> = {
  args: {
    name: 'Nadia Chen',
    role: 'Volunteer, labs',
    initials: 'NC',
    link: null,
  },
  render: (args) => ({
    props: args,
    template: `<sx-person-link [name]="name" [role]="role" [initials]="initials" [link]="link" />`,
  }),
};
