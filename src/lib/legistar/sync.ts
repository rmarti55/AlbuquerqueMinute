import { formatLegistarDate, getSyncWindow, parseLegistarStartAt } from '@/lib/datetime';
import { fetchHtml } from '@/lib/ingest/html';
import { upsertNormalizedMeetings } from '@/lib/meetings/upsert';
import type { NormalizedMeeting, SourceSyncCounts } from '@/lib/meetings/types';
import {
  eventTitle,
  fetchLegistarEvents,
  filesFromEvent,
  isCanceled,
  videoFromEvent,
} from './api';
import {
  calendarUrlFor,
  parseAbcwuaPublishedSchedule,
  parseLegistarCalendarHtml,
} from './calendar-html';
import { ABCWUA_TENANT, CABQ_TENANT, type LegistarTenant } from './config';

export interface SyncResult {
  fetched: number;
  upserted: number;
  withVideo: number;
  videosUpdated: number;
  videosInserted: number;
  videosPreserved: number;
  window: { lookback: string; lookahead: string };
}

function eventFilter(): { filter: string; window: SyncResult['window'] } {
  const { lookback, lookahead } = getSyncWindow();
  return {
    filter: `EventDate ge datetime'${formatLegistarDate(lookback)}' and EventDate le datetime'${formatLegistarDate(lookahead)}'`,
    window: {
      lookback: lookback.toISODate() ?? '',
      lookahead: lookahead.toISODate() ?? '',
    },
  };
}

export function eventsToNormalized(
  events: Awaited<ReturnType<typeof fetchLegistarEvents>>,
  tenant: LegistarTenant,
): NormalizedMeeting[] {
  return events.map((event) => ({
    source: tenant.source,
    sourceId: String(event.EventId),
    body: event.EventBodyName,
    title: eventTitle(event),
    startAt: parseLegistarStartAt(event.EventDate, event.EventTime),
    status: isCanceled(event) ? 'canceled' : 'scheduled',
    sourceUrl: event.EventInSiteURL,
    agendaUrl: event.EventAgendaFile ?? null,
    location: event.EventLocation,
    files: filesFromEvent(event),
    video: videoFromEvent(event, tenant),
  }));
}

function inWindow(startAt: Date): boolean {
  const { lookback, lookahead } = getSyncWindow();
  return startAt >= lookback.toJSDate() && startAt <= lookahead.toJSDate();
}

async function fallbackCalendarMeetings(tenant: LegistarTenant): Promise<NormalizedMeeting[]> {
  const url = calendarUrlFor(tenant);
  const html = await fetchHtml(url);
  const fromCalendar = parseLegistarCalendarHtml(html, tenant, url);
  if (tenant.client !== 'abcwua') return fromCalendar.filter((m) => inWindow(m.startAt));

  const publishedHtml = await fetchHtml(
    'https://www.abcwua.org/your-water-authority-2026-meetings/',
  );
  const published = parseAbcwuaPublishedSchedule(publishedHtml);
  const byId = new Map<string, NormalizedMeeting>();
  for (const meeting of [...fromCalendar, ...published]) {
    if (!inWindow(meeting.startAt)) continue;
    const key = `${meeting.body}:${meeting.startAt.toISOString().slice(0, 10)}`;
    if (!byId.has(key) || meeting.agendaUrl) byId.set(key, meeting);
  }
  return [...byId.values()];
}

export async function syncLegistarTenant(tenant: LegistarTenant): Promise<SourceSyncCounts> {
  const { filter } = eventFilter();
  let normalized: NormalizedMeeting[] = [];
  let error: string | undefined;

  try {
    const events = await fetchLegistarEvents(tenant, filter);
    normalized = eventsToNormalized(events, tenant);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    normalized = await fallbackCalendarMeetings(tenant);
  }

  const { upserted, withVideo } = await upsertNormalizedMeetings(normalized);
  return {
    source: tenant.source,
    fetched: normalized.length,
    upserted,
    withVideo,
    error: error && normalized.length === 0 ? error : undefined,
  };
}

/** cabq Council + committees (source = 'legistar'). */
export async function syncLegistarMeetings(): Promise<SyncResult> {
  const { window } = eventFilter();
  const result = await syncLegistarTenant(CABQ_TENANT);
  return {
    fetched: result.fetched,
    upserted: result.upserted,
    withVideo: result.withVideo,
    videosUpdated: 0,
    videosInserted: result.withVideo,
    videosPreserved: 0,
    window,
  };
}

export async function syncAbcwuaMeetings(): Promise<SourceSyncCounts> {
  return syncLegistarTenant(ABCWUA_TENANT);
}
