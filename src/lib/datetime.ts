import { DateTime } from 'luxon';

export const EVENT_TIMEZONE = 'America/Denver';

export function getSyncWindow(): { lookback: DateTime; lookahead: DateTime } {
  const now = DateTime.now().setZone(EVENT_TIMEZONE).startOf('day');
  return {
    lookback: now.minus({ days: 14 }),
    lookahead: now.plus({ days: 60 }).endOf('day'),
  };
}

export function formatLegistarDate(dt: DateTime): string {
  return dt.toFormat("yyyy-MM-dd'T'HH:mm:ss");
}

export function parseLegistarStartAt(eventDate: string, eventTime: string | null): Date {
  const datePart = eventDate.slice(0, 10);
  const timePart = eventTime?.trim() || '12:00 AM';
  const parsed = DateTime.fromFormat(
    `${datePart} ${timePart}`,
    'yyyy-MM-dd h:mm a',
    { zone: EVENT_TIMEZONE },
  );
  if (!parsed.isValid) {
    return DateTime.fromISO(datePart, { zone: EVENT_TIMEZONE }).toJSDate();
  }
  return parsed.toJSDate();
}

export function formatMeetingDateTime(startAt: Date): string {
  return DateTime.fromJSDate(startAt, { zone: EVENT_TIMEZONE }).toFormat(
    'EEE MMM d, yyyy · h:mm a',
  );
}
