import { and, eq } from 'drizzle-orm';
import {
  getDb,
  meetings,
  meetingFiles,
  meetingVideos,
  meetingTranscripts,
} from '@/lib/db';
import type { NormalizedMeeting } from './types';

async function hasCompletedTranscript(meetingId: number): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: meetingTranscripts.id })
    .from(meetingTranscripts)
    .where(
      and(
        eq(meetingTranscripts.meetingId, meetingId),
        eq(meetingTranscripts.status, 'completed'),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function mergeMeetingVideo(
  meetingId: number,
  video: NormalizedMeeting['video'],
): Promise<'updated' | 'inserted' | 'preserved' | 'deleted' | 'skipped' | 'none'> {
  if (video === undefined) return 'skipped';

  const db = getDb();
  const existing = await db
    .select()
    .from(meetingVideos)
    .where(eq(meetingVideos.meetingId, meetingId))
    .limit(1);
  const row = existing[0];

  if (video) {
    const granicusClipId = video.granicusClipId ?? row?.granicusClipId ?? null;
    const youtubeId = video.youtubeId ?? row?.youtubeId ?? null;
    const playerUrl =
      video.playerUrl ??
      row?.playerUrl ??
      (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null);
    const matchMethod = row?.youtubeId
      ? row.matchMethod
      : row?.granicusClipId
        ? row.matchMethod
        : video.matchMethod;

    if (row) {
      await db
        .update(meetingVideos)
        .set({
          granicusClipId,
          youtubeId,
          playerUrl,
          matchMethod,
          matchedAt: new Date(),
        })
        .where(eq(meetingVideos.id, row.id));
      return 'updated';
    }

    await db.insert(meetingVideos).values({
      meetingId,
      granicusClipId,
      youtubeId,
      playerUrl,
      matchMethod: video.matchMethod,
    });
    return 'inserted';
  }

  if (!row) return 'none';
  if (row.youtubeId || (await hasCompletedTranscript(meetingId))) {
    return 'preserved';
  }

  await db.delete(meetingVideos).where(eq(meetingVideos.id, row.id));
  return 'deleted';
}

export async function upsertNormalizedMeeting(meeting: NormalizedMeeting): Promise<{
  id: number;
  withVideo: boolean;
}> {
  const db = getDb();
  const sourceUrl = meeting.sourceUrl ?? null;
  const agendaUrl = meeting.agendaUrl ?? null;
  const location = meeting.location ?? null;

  const existing = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.source, meeting.source), eq(meetings.sourceId, meeting.sourceId)))
    .limit(1);

  let row: { id: number };
  if (existing[0]) {
    await db
      .update(meetings)
      .set({
        body: meeting.body,
        title: meeting.title,
        startAt: meeting.startAt,
        sourceUrl,
        agendaUrl,
        location,
        status: meeting.status,
        syncedAt: new Date(),
      })
      .where(eq(meetings.id, existing[0].id));
    row = existing[0];
  } else {
    const inserted = await db
      .insert(meetings)
      .values({
        body: meeting.body,
        title: meeting.title,
        startAt: meeting.startAt,
        source: meeting.source,
        sourceId: meeting.sourceId,
        sourceUrl,
        agendaUrl,
        location,
        status: meeting.status,
        syncedAt: new Date(),
      })
      .returning({ id: meetings.id });
    row = inserted[0];
  }

  const videoResult = await mergeMeetingVideo(row.id, meeting.video);
  const withVideo =
    meeting.video != null || videoResult === 'updated' || videoResult === 'inserted';

  if (meeting.files) {
    await db.delete(meetingFiles).where(eq(meetingFiles.meetingId, row.id));
    if (meeting.files.length > 0) {
      await db.insert(meetingFiles).values(
        meeting.files.map((f) => ({
          meetingId: row.id,
          type: f.type,
          url: f.url,
          name: f.name,
        })),
      );
    }
  }

  return { id: row.id, withVideo };
}

export async function upsertNormalizedMeetings(items: NormalizedMeeting[]): Promise<{
  upserted: number;
  withVideo: number;
}> {
  let upserted = 0;
  let withVideo = 0;
  for (const item of items) {
    const result = await upsertNormalizedMeeting(item);
    upserted += 1;
    if (result.withVideo) withVideo += 1;
  }
  return { upserted, withVideo };
}
