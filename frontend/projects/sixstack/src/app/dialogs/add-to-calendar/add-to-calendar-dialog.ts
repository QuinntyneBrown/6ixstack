import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EventDetail, EVENTS_API } from 'api';
import { Alert, DialogShell, OptionButton, ToastService } from 'components';
import { finalize } from 'rxjs';
import { FileDownloader } from '../../shared/file-downloader';
import { CalendarLinkBuilder } from './calendar-link-builder';

export const ADD_TO_CALENDAR_TITLE_ID = 'add-to-calendar-title';
export const ADD_TO_CALENDAR_DESCRIPTION_ID = 'add-to-calendar-description';

type FileOption = 'apple' | 'other';

/**
 * "Add to my calendar" (L2-037): Google Calendar and Outlook open prefilled pages; Apple Calendar and other apps
 * download the event's .ics file, with a busy option while it is created and a failure alert if it can't be.
 */
@Component({
  selector: 'sx-add-to-calendar-dialog',
  imports: [Alert, DialogShell, OptionButton],
  template: `
    <sx-dialog-shell title="Add to my calendar" [titleId]="titleId">
      <p slot="description" class="dialog__description" [id]="descriptionId">{{ event.calendar.summary }}</p>
      <div class="stack">
        @if (fileFailed()) {
          <sx-alert kind="danger" announce="alert" title="We couldn't create the calendar file">
            Try again, or add it with Google Calendar or Outlook instead.
          </sx-alert>
        }
        <ul class="option-list">
          <li>
            <a
              sx-option-button
              icon="calendar"
              hint="Opens a new tab"
              endIcon="external"
              [href]="googleUrl()"
              target="_blank"
              rel="noopener noreferrer"
              (click)="close()"
              >Google Calendar</a
            >
          </li>
          <li>
            <a
              sx-option-button
              icon="calendar"
              hint="Outlook.com or Microsoft 365"
              endIcon="external"
              [href]="outlookUrl()"
              target="_blank"
              rel="noopener noreferrer"
              (click)="close()"
              >Outlook</a
            >
          </li>
          <li>
            <button
              sx-option-button
              type="button"
              icon="calendar"
              endIcon="download"
              hint="Downloads an .ics file"
              [busy]="busyOption() === 'apple'"
              (click)="download('apple')"
            >
              Apple Calendar
            </button>
          </li>
          <li>
            <button
              sx-option-button
              type="button"
              icon="calendar"
              endIcon="download"
              hint="Works with any calendar"
              [busy]="busyOption() === 'other'"
              (click)="download('other')"
            >
              Other app (.ics file)
            </button>
          </li>
        </ul>
      </div>
    </sx-dialog-shell>
  `,
  styles: `
    .dialog__description {
      margin-top: var(--spacingHorizontalXS);
      color: var(--colorNeutralForeground2);
    }
    .option-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalS);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToCalendarDialog {
  private readonly dialogRef = inject(DialogRef);
  private readonly api = inject(EVENTS_API);
  private readonly links = inject(CalendarLinkBuilder);
  private readonly downloader = inject(FileDownloader);
  private readonly toasts = inject(ToastService);

  protected readonly event = inject<EventDetail>(DIALOG_DATA);
  protected readonly titleId = ADD_TO_CALENDAR_TITLE_ID;
  protected readonly descriptionId = ADD_TO_CALENDAR_DESCRIPTION_ID;
  protected readonly busyOption = signal<FileOption | null>(null);
  protected readonly fileFailed = signal(false);
  protected readonly googleUrl = computed(() => this.links.google(this.event.title, this.event.calendar));
  protected readonly outlookUrl = computed(() => this.links.outlook(this.event.title, this.event.calendar));

  protected close(): void {
    this.dialogRef.close();
  }

  protected download(option: FileOption): void {
    this.busyOption.set(option);
    this.fileFailed.set(false);
    this.api
      .downloadIcs(this.event.slug)
      .pipe(finalize(() => this.busyOption.set(null)))
      .subscribe({
        next: (file) => {
          this.downloader.save(file.blob, file.fileName);
          this.toasts.show({
            kind: 'success',
            title: 'Calendar file downloaded',
            text: `Open ${file.fileName} to add ${this.event.title} to your calendar.`,
          });
          this.dialogRef.close();
        },
        error: () => this.fileFailed.set(true),
      });
  }
}
