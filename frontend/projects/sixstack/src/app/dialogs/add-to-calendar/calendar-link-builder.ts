import { Injectable } from '@angular/core';
import { CalendarInfo } from 'api';

/** Builds the Google Calendar and Outlook.com "add event" URLs from the event (feeds-and-sharing/add-to-calendar). */
@Injectable({ providedIn: 'root' })
export class CalendarLinkBuilder {
  google(title: string, calendar: CalendarInfo): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${this.compact(calendar.startsAtUtc)}/${this.compact(calendar.endsAtUtc)}`,
      ctz: 'America/Toronto',
      details: calendar.details,
      location: calendar.location,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  outlook(title: string, calendar: CalendarInfo): string {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      startdt: this.iso(calendar.startsAtUtc),
      enddt: this.iso(calendar.endsAtUtc),
      location: calendar.location,
      body: calendar.details,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
  }

  /** 20261105T140000Z */
  private compact(instant: string): string {
    return this.iso(instant).replace(/[-:]/g, '');
  }

  /** 2026-11-05T14:00:00Z */
  private iso(instant: string): string {
    return new Date(instant).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}
