import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { EventCancelled } from 'api';
import { modalDialogConfig, ToastService } from 'components';
import {
  CANCEL_EVENT_TITLE_ID,
  CancelEventDialog,
  CancelEventDialogData,
} from '../../dialogs/cancel-event/cancel-event-dialog';

export interface CancelTarget {
  id: string;
  title: string;
  isPaid: boolean;
  goingCount: number;
  emailableAttendees: number;
}

/** Opens Cancel “{title}”? and confirms a cancellation with a toast (cancel-toast/success), then calls `done`. */
@Injectable({ providedIn: 'root' })
export class CancelEventLauncher {
  private readonly dialog = inject(Dialog);
  private readonly toasts = inject(ToastService);

  open(target: CancelTarget, trigger: EventTarget | null, done: (result: EventCancelled) => void): void {
    this.dialog.open<EventCancelled, CancelEventDialogData>(
      CancelEventDialog,
      modalDialogConfig({
        data: {
          eventId: target.id,
          title: target.title,
          isPaid: target.isPaid,
          goingCount: target.goingCount,
          emailableAttendees: target.emailableAttendees,
          cancelled: (result) => {
            const emailed =
              result.emailsQueued > 0
                ? ` ${result.emailsQueued.toLocaleString('en-CA')} people were emailed.`
                : '';
            this.toasts.show({
              kind: 'success',
              title: `Cancelled “${result.title}”`,
              text: `It’s marked cancelled on 6ixstack and in calendar feeds.${emailed}`,
            });
            done(result);
          },
        },
        ariaLabelledBy: CANCEL_EVENT_TITLE_ID,
        ariaDescribedBy: 'cancel-description',
        restoreFocus: (trigger as HTMLElement | null) ?? true,
      }),
    );
  }
}
