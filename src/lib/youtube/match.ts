import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { getDb, meetings, meetingVideos } from '@/lib/db';
import { getSyncWindow } from '@/lib/datetime';
import { upsertNormalizedMeeting } from '@/lib/meetings/upsert';
import type { SourceSyncCounts } from '@/lib/meetings/types';
import { fetchYoutubeCatalog } from './catalog';
import { pickMatch } from './pick';

export async function matchYoutubeVideos(): Promise<SourceSyncCounts> {
  const catalog = await fetchYoutubeCatalog();
  const { lookback, lookahead } = getSyncWindow();
  const db = getDb();

  const rows = await db
    .select({
      id: meetings.id,
      source: meetings.source,
      sourceId: meetings.sourceId,
      body: meetings.body,
      title: meetings.title,
      startAt: meetings.startAt,
      status: meetings.status,
      sourceUrl: meetings.sourceUrl,
      agendaUrl: meetings.agendaUrl,
      location: meetings.location,
      youtubeId: meetingVideos.youtubeId,
    })
    .from(meetings)
    .leftJoin(meetingVideos, eq(meetingVideos.meetingId, meetings.id))
    .where(
      and(
        gte(meetings.startAt, lookback.toJSDate()),
        lte(meetings.startAt, lookahead.toJSDate()),
        or(isNull(meetingVideos.youtubeId), eq(meetingVideos.youtubeId, '')),
      ),
    );

  let upserted = 0;
  let withVideo = 0;
  const used = new Set<number>();

  for (const entry of catalog) {
    const match = pickMatch(
      entry,
      rows.filter((r) => !used.has(r.id)),
    );
    if (!match) continue;
    const row = rows.find((r) => r.id === match.id);
    if (!row) continue;
    used.add(row.id);
    await upsertNormalizedMeeting({
      source: row.source,
      sourceId: row.sourceId,
      body: row.body,
      title: row.title,
      startAt: row.startAt,
      status: row.status === 'canceled' ? 'canceled' : 'scheduled',
      sourceUrl: row.sourceUrl,
      agendaUrl: row.agendaUrl,
      location: row.location,
      video: {
        youtubeId: entry.videoId,
        playerUrl: `https://www.youtube.com/watch?v=${entry.videoId}`,
        matchMethod: 'youtube_title_date',
      },
    });
    upserted += 1;
    withVideo += 1;
  }

  return {
    source: 'youtube',
    fetched: catalog.length,
    upserted,
    withVideo,
  };
}
