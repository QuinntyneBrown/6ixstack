const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Toronto',
});

/** "9:42 AM": a time of day in Toronto, as every 6ixstack screen shows it. */
export function formatTorontoTime(date: Date): string {
  return timeFormat.format(date);
}

/** Today's date in Toronto as yyyy-MM-dd ("not in the past" and "today" follow the Toronto calendar day). */
export function torontoToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(now);
}
