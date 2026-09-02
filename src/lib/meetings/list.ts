import { and, desc, gte, lte, sql } from 'drizzle-orm';
import { getDb, meetings, meetingVideos } from '@/lib/db';
import { getSyncWindow } from '@/lib/datetime';

export interface MeetingRow {
  id: number;
  body: string;
  title: string;
  startAt: Date;
  status: string;
  sourceUrl: string | null;
  agendaUrl: string | null;
  hasVideo: boolean;
  granicusClipId: number | null;
  playerUrl: string | null;
}

export async function listMeetingsInWindow(): Promise<MeetingRow[]> {
  const { lookback, lookahead } = getSyncWindow();
  const db = getDb();

  const rows = await db
    .select({
      id: meetings.id,
      body: meetings.body,
      title: meetings.title,
      startAt: meetings.startAt,
      status: meetings.status,
      sourceUrl: meetings.sourceUrl,
      agendaUrl: meetings.agendaUrl,
      hasVideo: sql<boolean>`${meetingVideos.id} IS NOT NULL`.as('has_video'),
      granicusClipId: meetingVideos.granicusClipId,
      playerUrl: meetingVideos.playerUrl,
    })
    .from(meetings)
    .leftJoin(meetingVideos, sql`${meetingVideos.meetingId} = ${meetings.id}`)
    .where(
      and(
        gte(meetings.startAt, lookback.toJSDate()),
        lte(meetings.startAt, lookahead.toJSDate()),
      ),
    )
    .orderBy(desc(meetings.startAt));

  return rows;
}

export async function getMeetingCounts() {
  const list = await listMeetingsInWindow();
  return {
    total: list.length,
    withVideo: list.filter((m) => m.hasVideo).length,
    upcoming: list.filter((m) => m.startAt > new Date()).length,
  };
}
