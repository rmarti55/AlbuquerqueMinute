import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb, meetings, meetingVideos, meetingTranscripts } from '@/lib/db';
import type { TranscriptStatus } from '@/lib/db/schema';
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
  transcriptStatus: TranscriptStatus | null;
  transcriptError: string | null;
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
      transcriptStatus: meetingTranscripts.status,
      transcriptError: meetingTranscripts.errorMessage,
    })
    .from(meetings)
    .leftJoin(meetingVideos, sql`${meetingVideos.meetingId} = ${meetings.id}`)
    .leftJoin(meetingTranscripts, eq(meetingTranscripts.videoId, meetingVideos.id))
    .where(
      and(
        gte(meetings.startAt, lookback.toJSDate()),
        lte(meetings.startAt, lookahead.toJSDate()),
      ),
    )
    .orderBy(desc(meetings.startAt));

  return rows.map((row) => ({
    ...row,
    transcriptStatus: row.transcriptStatus as TranscriptStatus | null,
  }));
}

export async function getMeetingCounts() {
  const list = await listMeetingsInWindow();
  return {
    total: list.length,
    withVideo: list.filter((m) => m.hasVideo).length,
    upcoming: list.filter((m) => m.startAt > new Date()).length,
    transcribed: list.filter((m) => m.transcriptStatus === 'completed').length,
  };
}

export async function getMeetingWithTranscript(meetingId: number) {
  const db = getDb();
  const rows = await db
    .select({
      id: meetings.id,
      body: meetings.body,
      title: meetings.title,
      startAt: meetings.startAt,
      sourceUrl: meetings.sourceUrl,
      agendaUrl: meetings.agendaUrl,
      granicusClipId: meetingVideos.granicusClipId,
      playerUrl: meetingVideos.playerUrl,
      transcriptStatus: meetingTranscripts.status,
      rawTranscript: meetingTranscripts.rawTranscript,
      transcriptError: meetingTranscripts.errorMessage,
    })
    .from(meetings)
    .leftJoin(meetingVideos, eq(meetingVideos.meetingId, meetings.id))
    .leftJoin(meetingTranscripts, eq(meetingTranscripts.videoId, meetingVideos.id))
    .where(eq(meetings.id, meetingId))
    .limit(1);

  return rows[0] ?? null;
}
