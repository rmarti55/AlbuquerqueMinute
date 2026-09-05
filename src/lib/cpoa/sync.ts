import { getSyncWindow } from '@/lib/datetime';
import { fetchHtml } from '@/lib/ingest/html';
import { upsertNormalizedMeetings } from '@/lib/meetings/upsert';
import type { SourceSyncCounts } from '@/lib/meetings/types';
import { CPOA_EVENTS_URL, parseCpoaEventsPage } from './parse';

export async function syncCpoaMeetings(): Promise<SourceSyncCounts> {
  const html = await fetchHtml(CPOA_EVENTS_URL);
  const { lookback, lookahead } = getSyncWindow();
  const meetings = parseCpoaEventsPage(html).filter(
    (m) => m.startAt >= lookback.toJSDate() && m.startAt <= lookahead.toJSDate(),
  );
  const { upserted, withVideo } = await upsertNormalizedMeetings(meetings);
  return {
    source: 'cpoa',
    fetched: meetings.length,
    upserted,
    withVideo,
  };
}
