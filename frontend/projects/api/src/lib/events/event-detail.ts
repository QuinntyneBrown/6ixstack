/** The event detail model; the API decides state, facts, actions and alerts (view-event-detail design). */
export interface EventDetail {
  slug: string;
  title: string;
  description: string;
  state: 'upcoming' | 'past' | 'cancelled';
  format: 'inPerson' | 'streaming' | 'hybrid';
  /** `slug` is null for a new organizer without a community yet. */
  community: { slug: string | null; name: string };
  topics: string[];
  dateTile: { month: string; day: string };
  facts: {
    when: {
      dateLabel: string;
      timeRange: string;
      sourceTime: string | null;
      suffix: 'ended' | 'cancelled' | null;
    };
    venue: { name: string; address: string; directionsUrl: string; travelNotes: string | null } | null;
    stream: LabelledFact | null;
    price: LabelledFact | null;
    attendance: LabelledFact | null;
  };
  agenda: { time: string; title: string }[];
  speakers: { slug: string; name: string; initials: string; role: string }[];
  actions: {
    primary: { label: string; url: string } | null;
    join: { label: string; opensAtUtc: string; url: string | null } | null;
    addToCalendar: boolean;
    share: boolean;
    report: boolean;
    caption: string | null;
    recordingUrl: string | null;
    slidesUrl: string | null;
    findAnother: Link | null;
    follow: Link | null;
  };
  alerts: EventAlert[];
  dockedBar: { when: string; summary: string; action: { label: string; url: string } } | null;
  calendar: CalendarInfo;
}

/** What calendar apps need: the dialog's summary line and the event for Google and Outlook links. */
export interface CalendarInfo {
  summary: string;
  startsAtUtc: string;
  endsAtUtc: string;
  location: string;
  details: string;
}

export interface LabelledFact {
  label: string;
  note: string | null;
}

export interface Link {
  label: string;
  href: string;
}

export interface EventAlert {
  kind: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  text: string | null;
  action: { label: string; href: string | null; kind: string | null } | null;
}
