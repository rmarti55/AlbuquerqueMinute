import { getSyncWindow } from '@/lib/datetime';
import { fetchHtml } from '@/lib/ingest/html';
import { upsertNormalizedMeetings } from '@/lib/meetings/upsert';
import type { SourceSyncCounts } from '@/lib/meetings/types';
import { parseBoardPage } from './parse';
import { BOARD_PAGES } from './registry';

export async function syncClerkBoardMeetings(): Promise<SourceSyncCounts> {
  const { lookback, lookahead } = getSyncWindow();
  const all = [];
  const errors: string[] = [];

  for (const board of BOARD_PAGES) {
    try {
      const html = await fetchHtml(board.url);
      all.push(
        ...parseBoardPage(html, board).filter(
          (m) => m.startAt >= lookback.toJSDate() && m.startAt <= lookahead.toJSDate(),
        ),
      );
    } catch (err) {
      errors.push(`${board.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  const { upserted, withVideo } = await upsertNormalizedMeetings(all);
  return {
    source: 'clerk_board',
    fetched: all.length,
    upserted,
    withVideo,
    error: errors.length ? errors.join('; ') : undefined,
  };
}
