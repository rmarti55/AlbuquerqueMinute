import {
  classifyFile,
  combineDateTime,
  extractLinks,
  parseFlexibleDate,
  parseFlexibleTime,
  stripTags,
} from '@/lib/ingest/html';
import type { NormalizedMeeting } from '@/lib/meetings/types';

export const CPOA_EVENTS_URL = 'https://www.cabq.gov/cpoa/events';
export const CPOA_BODY = 'Civilian Police Oversight Advisory Board';
const CPOA_LOCATION =
  'Vincent E. Griego Chambers, One Civic Plaza NW, Albuquerque, NM';

const DATE_LINE =
  /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4}/g;

export function parseCpoaEventsPage(html: string): NormalizedMeeting[] {
  const text = stripTags(html);
  const dates = [...text.matchAll(DATE_LINE)].map((m) => m[0]);
  const seen = new Set<string>();
  const meetings: NormalizedMeeting[] = [];
  const links = extractLinks(html, CPOA_EVENTS_URL);
  const defaultTime = { hour: 17, minute: 0 };

  for (const raw of dates) {
    const date = parseFlexibleDate(raw);
    if (!date) continue;
    const day = date.toISODate();
    if (!day || seen.has(day)) continue;
    seen.add(day);

    const time = parseFlexibleTime(raw) ?? defaultTime;
    const startAt = combineDateTime(date, time, defaultTime);
    const nearby = links.filter((l) => {
      const linkDate = parseFlexibleDate(l.text);
      return linkDate?.toISODate() === day || l.href.includes(date.toFormat('MM-dd-yyyy'));
    });
    const files = nearby
      .map((l) => {
        const type = classifyFile(l.text, l.href);
        return type ? { type, url: l.href, name: l.text || type } : null;
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
    const agenda = files.find((f) => f.type === 'agenda');

    meetings.push({
      source: 'cpoa',
      sourceId: `cpoab:${day}`,
      body: CPOA_BODY,
      title: CPOA_BODY,
      startAt,
      status: /cancel/i.test(raw) ? 'canceled' : 'scheduled',
      sourceUrl: CPOA_EVENTS_URL,
      agendaUrl: agenda?.url ?? CPOA_EVENTS_URL,
      location: /zoom|plaza del sol/i.test(raw) ? 'Hybrid / Plaza Del Sol' : CPOA_LOCATION,
      files,
    });
  }

  // Plone event tiles: "Sep 10, 2026 from 05:00 PM"
  const tileRe =
    /([A-Za-z]{3,9}\.?\s+\d{1,2},\s+\d{4})\s+from\s+(\d{1,2}:\d{2}\s*[AP]M)/gi;
  let tile: RegExpExecArray | null;
  while ((tile = tileRe.exec(text))) {
    const date = parseFlexibleDate(tile[1]);
    if (!date) continue;
    const day = date.toISODate();
    if (!day || seen.has(day)) continue;
    seen.add(day);
    const time = parseFlexibleTime(tile[2]);
    meetings.push({
      source: 'cpoa',
      sourceId: `cpoab:${day}`,
      body: CPOA_BODY,
      title: CPOA_BODY,
      startAt: combineDateTime(date, time, defaultTime),
      status: 'scheduled',
      sourceUrl: CPOA_EVENTS_URL,
      agendaUrl: CPOA_EVENTS_URL,
      location: CPOA_LOCATION,
      files: [],
    });
  }

  return meetings;
}
