import { getSyncWindow } from '@/lib/datetime';
import { fetchHtml } from '@/lib/ingest/html';
import { upsertNormalizedMeetings } from '@/lib/meetings/upsert';
import type { SourceSyncCounts } from '@/lib/meetings/types';
import { PLANNING_BODIES } from './config';
import { parsePlanningPage } from './parse';

function inWindow(startAt: Date): boolean {
  const { lookback, lookahead } = getSyncWindow();
  return startAt >= lookback.toJSDate() && startAt <= lookahead.toJSDate();
}

export async function syncPlanningMeetings(): Promise<SourceSyncCounts> {
  const all = [];
  const errors: string[] = [];

  for (const body of PLANNING_BODIES) {
    try {
      const html = await fetchHtml(body.url);
      all.push(...parsePlanningPage(html, body).filter((m) => inWindow(m.startAt)));
    } catch (err) {
      errors.push(`${body.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  const { upserted, withVideo } = await upsertNormalizedMeetings(all);
  return {
    source: 'planning',
    fetched: all.length,
    upserted,
    withVideo,
    error: errors.length ? errors.join('; ') : undefined,
  };
}
