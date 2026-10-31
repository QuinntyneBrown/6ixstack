import type { StoryObj } from '@storybook/angular';
import { PersonLink } from '../../../src/lib/person/person-link';

export const Default: StoryObj<PersonLink> = {
  args: {
    name: 'Priya Natarajan',
    role: 'Azure MVP · Cloud architect, Rogers',
    initials: 'PN',
    link: '/speakers/priya-natarajan',
  },
  render: (args) => ({
    props: args,
    template: `<sx-person-link [name]="name" [role]="role" [initials]="initials" [link]="link" />`,
  }),
};
