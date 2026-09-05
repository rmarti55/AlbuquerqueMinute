import { EVENT_TIMEZONE, parseLegistarStartAt } from '@/lib/datetime';
import { extractLinks, parseFlexibleDate, parseFlexibleTime, stripTags } from '@/lib/ingest/html';
import type { NormalizedMeeting } from '@/lib/meetings/types';
import type { LegistarTenant } from './config';

const ROW_RE =
  /<a id="[^"]*hypBody"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td class="rgSorted">(\d{1,2}\/\d{1,2}\/\d{4})<\/td>[\s\S]*?<span id="[^"]*lblTime"[^>]*>([\s\S]*?)<\/span>([\s\S]*?)(?=<a id="[^"]*hypBody"|$)/gi;

export function parseLegistarCalendarHtml(
  html: string,
  tenant: LegistarTenant,
  calendarUrl: string,
): NormalizedMeeting[] {
  const meetings: NormalizedMeeting[] = [];
  const matches = [...html.matchAll(ROW_RE)];
  for (const match of matches) {
    const body = stripTags(match[1]).trim();
    const date = parseFlexibleDate(match[2]);
    if (!date) continue;
    const timeText = stripTags(match[3]);
    const rest = match[4] ?? '';
    const startAt = parseLegistarStartAt(date.toFormat('yyyy-MM-dd'), timeText || '5:00 PM');
    const day = date.toISODate();
    if (!day) continue;

    const links = extractLinks(rest, calendarUrl);
    const detail = links.find((l) => l.href.includes('MeetingDetail.aspx'));
    const agenda = links.find((l) => /agenda/i.test(l.text) || l.href.includes('View.ashx?M=A'));
    const minutes = links.find((l) => /minutes/i.test(l.text));
    const idMatch = (detail?.href ?? agenda?.href ?? '').match(/[?&]ID=(\d+)/);
    const sourceId = idMatch?.[1] ?? `cal:${slug(body)}:${day}`;

    const files = [];
    if (agenda) files.push({ type: 'agenda', url: agenda.href, name: agenda.text || 'Agenda' });
    if (minutes) files.push({ type: 'minutes', url: minutes.href, name: minutes.text || 'Minutes' });

    meetings.push({
      source: tenant.source,
      sourceId,
      body,
      title: body,
      startAt,
      status: /cancel/i.test(timeText) ? 'canceled' : 'scheduled',
      sourceUrl: detail?.href ?? calendarUrl,
      agendaUrl: agenda?.href ?? null,
      location: null,
      files,
    });
  }
  return meetings;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Published ABCWUA board dates when the REST API is misconfigured. */
export function parseAbcwuaPublishedSchedule(html: string): NormalizedMeeting[] {
  const body = 'Albuquerque Bernalillo County Water Utility Authority';
  const meetings: NormalizedMeeting[] = [];
  const seen = new Set<string>();
  const re =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const raw = `${match[1]} ${match[2]}, 2026`;
    const date = parseFlexibleDate(raw);
    if (!date) continue;
    const day = date.toISODate();
    if (!day || seen.has(day)) continue;
    seen.add(day);
    const time = parseFlexibleTime('5:00 PM');
    meetings.push({
      source: 'legistar_abcwua',
      sourceId: `published:${day}`,
      body,
      title: body,
      startAt: date
        .setZone(EVENT_TIMEZONE)
        .set({ hour: time?.hour ?? 17, minute: time?.minute ?? 0, second: 0 })
        .toJSDate(),
      status: 'scheduled',
      sourceUrl: 'https://www.abcwua.org/your-water-authority-2026-meetings/',
      agendaUrl: 'https://abcwua.legistar.com/Calendar.aspx',
      location: 'Vincent E. Griego Chambers, One Civic Plaza NW',
    });
  }
  return meetings;
}

export function calendarUrlFor(tenant: LegistarTenant): string {
  return `https://${tenant.client}.legistar.com/Calendar.aspx`;
}
