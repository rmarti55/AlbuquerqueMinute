import { DateTime } from 'luxon';
import {
  classifyFile,
  combineDateTime,
  extractLinks,
  isRecordingLink,
  parseFlexibleDate,
  parseFlexibleTime,
  stripTags,
  youtubeIdFromUrl,
} from '@/lib/ingest/html';
import type { MeetingFileInput, MeetingVideoInput, NormalizedMeeting } from '@/lib/meetings/types';
import type { PlanningBody } from './config';

function headingDate(heading: string): DateTime | null {
  return parseFlexibleDate(heading);
}

/** Split Plone page into h2/h3 sections that look like a meeting. */
export function splitMeetingSections(html: string): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = [];
  const re = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const matches = [...html.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const heading = stripTags(matches[i][1]);
    if (!headingDate(heading) && !/meeting|hearing/i.test(heading)) continue;
    if (!headingDate(heading)) continue;
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = matches[i + 1]?.index ?? html.length;
    sections.push({ heading, body: html.slice(start, end) });
  }
  return sections;
}

function meetingFromBlock(
  body: PlanningBody,
  date: DateTime,
  block: string,
): NormalizedMeeting | null {
  const day = date.toISODate();
  if (!day || date.year < 2025 || date.year > 2028) return null;
  const time = parseFlexibleTime(stripTags(block));
  const links = extractLinks(block, body.url);
  const files: MeetingFileInput[] = [];
  let agendaUrl: string | null = null;
  let video: MeetingVideoInput | undefined;

  for (const link of links) {
    if (isRecordingLink(link.text, link.href)) {
      const youtubeId = youtubeIdFromUrl(link.href);
      video = {
        youtubeId,
        playerUrl: link.href,
        matchMethod: 'planning_page',
      };
      continue;
    }
    const type = classifyFile(link.text, link.href);
    if (!type) continue;
    files.push({ type, url: link.href, name: link.text || type });
    if (type === 'agenda' && !agendaUrl) agendaUrl = link.href;
  }

  return {
    source: 'planning',
    sourceId: `${body.slug}:${day}`,
    body: body.body,
    title: body.body,
    startAt: combineDateTime(date, time, body.defaultTime),
    status: /cancel/i.test(block) ? 'canceled' : 'scheduled',
    sourceUrl: body.url,
    agendaUrl,
    location: body.location,
    files,
    video,
  };
}

/** ZHE / DHO / Landmarks use list items, not dated h3s. */
export function parsePlanningListItems(html: string, body: PlanningBody): NormalizedMeeting[] {
  const chunks = html.split(/<(?:li|p)\b/i);
  const byDay = new Map<string, NormalizedMeeting>();

  for (const chunk of chunks) {
    const text = stripTags(chunk);
    if (!/meeting|hearing|agenda|minutes|action sheet|decision/i.test(text) && !headingDate(text)) {
      continue;
    }
    const date = headingDate(text);
    if (!date) continue;
    const meeting = meetingFromBlock(body, date, chunk);
    if (!meeting) continue;
    const existing = byDay.get(meeting.sourceId);
    if (!existing || (meeting.files?.length ?? 0) >= (existing.files?.length ?? 0)) {
      if (existing?.files?.length && meeting.files) {
        const urls = new Set(meeting.files.map((f) => f.url));
        meeting.files = [
          ...meeting.files,
          ...existing.files.filter((f) => !urls.has(f.url)),
        ];
        meeting.agendaUrl = meeting.agendaUrl ?? existing.agendaUrl;
        meeting.video = meeting.video ?? existing.video;
      }
      byDay.set(meeting.sourceId, meeting);
    }
  }

  return [...byDay.values()];
}

export function parsePlanningPage(html: string, body: PlanningBody): NormalizedMeeting[] {
  const byId = new Map<string, NormalizedMeeting>();
  for (const section of splitMeetingSections(html)) {
    const date = headingDate(section.heading);
    if (!date) continue;
    const meeting = meetingFromBlock(body, date, `${section.heading} ${section.body}`);
    if (meeting) byId.set(meeting.sourceId, meeting);
  }
  for (const meeting of parsePlanningListItems(html, body)) {
    const existing = byId.get(meeting.sourceId);
    if (!existing || (meeting.files?.length ?? 0) > (existing.files?.length ?? 0)) {
      byId.set(meeting.sourceId, meeting);
    }
  }
  return [...byId.values()];
}
