import {
  classifyFile,
  combineDateTime,
  extractLinks,
  parseFlexibleDate,
  parseFlexibleTime,
  stripTags,
} from '@/lib/ingest/html';
import type { NormalizedMeeting } from '@/lib/meetings/types';
import type { BoardPage } from './registry';

const DATE_LINE =
  /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4}|[A-Za-z]{3,9}\.?\s+\d{1,2},\s+\d{4}/g;

export function parseBoardPage(html: string, board: BoardPage): NormalizedMeeting[] {
  const text = stripTags(html);
  const dates = [...text.matchAll(DATE_LINE)].map((m) => m[0]);
  const seen = new Set<string>();
  const meetings: NormalizedMeeting[] = [];
  const links = extractLinks(html, board.url);

  for (const raw of dates) {
    const date = parseFlexibleDate(raw);
    if (!date) continue;
    const year = date.year;
    if (year < 2025 || year > 2028) continue;
    const day = date.toISODate();
    if (!day || seen.has(day)) continue;
    seen.add(day);

    const nearby = links.filter((l) => parseFlexibleDate(l.text)?.toISODate() === day);
    const files = nearby
      .map((l) => {
        const type = classifyFile(l.text, l.href);
        return type ? { type, url: l.href, name: l.text || type } : null;
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
    const agenda = files.find((f) => f.type === 'agenda');

    meetings.push({
      source: 'clerk_board',
      sourceId: `${board.slug}:${day}`,
      body: board.body,
      title: board.body,
      startAt: combineDateTime(date, parseFlexibleTime(raw), board.defaultTime),
      status: /cancel/i.test(raw) ? 'canceled' : 'scheduled',
      sourceUrl: board.url,
      agendaUrl: agenda?.url ?? board.url,
      location: null,
      files,
    });
  }

  return meetings;
}
