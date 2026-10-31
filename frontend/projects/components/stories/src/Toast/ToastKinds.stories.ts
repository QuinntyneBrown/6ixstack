import type { StoryObj } from '@storybook/angular';
import { Toast } from '../../../src/lib/toast/toast';

const toast = (id: number, kind: string, title: string, text: string) => ({
  id,
  kind,
  title,
  text,
  remainingMs: kind === 'danger' ? null : 8000,
  paused: true,
});

export const Kinds: StoryObj<Toast> = {
  render: () => ({
    props: {
      toasts: [
        toast(
          1,
          'info',
          'Times are in Toronto time (ET)',
          "Streams also show the time where they're hosted.",
        ),
        toast(2, 'success', 'Added to Google Calendar', 'Azure Data & AI Day GTA, Thu Nov 5.'),
        toast(3, 'warning', 'Link checks are slow', 'Your event is saved; checks finish shortly.'),
        toast(4, 'danger', "Couldn't copy the link", 'Select the link and copy it manually.'),
      ],
    },
    template: `<div class="stack" style="max-width: 24rem">
      @for (t of toasts; track t.id) { <sx-toast [toast]="t" /> }
    </div>`,
  }),
};
