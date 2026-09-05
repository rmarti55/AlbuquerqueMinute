import { syncAbcwuaMeetings, syncLegistarMeetings } from '@/lib/legistar/sync';
import { syncPlanningMeetings } from '@/lib/planning/sync';
import { syncCpoaMeetings } from '@/lib/cpoa/sync';
import { syncClerkBoardMeetings } from '@/lib/boards/sync';
import { matchYoutubeVideos } from '@/lib/youtube/match';
import type { SourceSyncCounts } from '@/lib/meetings/types';

export type SyncAllResult = {
  sources: SourceSyncCounts[];
  upserted: number;
  withVideo: number;
  errors: string[];
};

async function runOne(
  name: string,
  fn: () => Promise<SourceSyncCounts>,
): Promise<SourceSyncCounts> {
  try {
    return await fn();
  } catch (err) {
    return {
      source: name,
      fetched: 0,
      upserted: 0,
      withVideo: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function syncAllMeetings(): Promise<SyncAllResult> {
  const sources = [
    await runOne('legistar', async () => {
      const r = await syncLegistarMeetings();
      return {
        source: 'legistar',
        fetched: r.fetched,
        upserted: r.upserted,
        withVideo: r.withVideo,
      };
    }),
    await runOne('legistar_abcwua', syncAbcwuaMeetings),
    await runOne('planning', syncPlanningMeetings),
    await runOne('cpoa', syncCpoaMeetings),
    await runOne('clerk_board', syncClerkBoardMeetings),
    await runOne('youtube', matchYoutubeVideos),
  ];

  return {
    sources,
    upserted: sources.reduce((n, s) => n + s.upserted, 0),
    withVideo: sources.reduce((n, s) => n + s.withVideo, 0),
    errors: sources.filter((s) => s.error).map((s) => `${s.source}: ${s.error}`),
  };
}
