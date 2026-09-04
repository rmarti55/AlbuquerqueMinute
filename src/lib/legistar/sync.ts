import { and, eq } from 'drizzle-orm';
import {
  getDb,
  meetings,
  meetingVideos,
  meetingFiles,
  meetingTranscripts,
} from '@/lib/db';
import { formatLegistarDate, getSyncWindow, parseLegistarStartAt } from '@/lib/datetime';
import {
  eventTitle,
  fetchLegistarEvents,
  filesFromEvent,
  isCanceled,
  videoFromEvent,
} from './api';

export interface SyncResult {
  fetched: number;
  upserted: number;
  withVideo: number;
  videosUpdated: number;
  videosInserted: number;
  videosPreserved: number;
  window: { lookback: string; lookahead: string };
}

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

async function syncMeetingVideo(
  meetingId: number,
  video: ReturnType<typeof videoFromEvent>,
): Promise<'updated' | 'inserted' | 'preserved' | 'deleted' | 'none'> {
  const db = getDb();
  const existing = await db
    .select()
    .from(meetingVideos)
    .where(eq(meetingVideos.meetingId, meetingId))
    .limit(1);
  const row = existing[0];

  if (video) {
    if (row) {
      await db
        .update(meetingVideos)
        .set({
          granicusClipId: video.granicusClipId,
          playerUrl: video.playerUrl,
          matchMethod: video.matchMethod,
          matchedAt: new Date(),
        })
        .where(eq(meetingVideos.id, row.id));
      return 'updated';
    }

    await db.insert(meetingVideos).values({
      meetingId,
      granicusClipId: video.granicusClipId,
      playerUrl: video.playerUrl,
      matchMethod: video.matchMethod,
    });
    return 'inserted';
  }

  if (!row) return 'none';

  if (await hasCompletedTranscript(meetingId)) {
    return 'preserved';
  }

  await db.delete(meetingVideos).where(eq(meetingVideos.id, row.id));
  return 'deleted';
}

export async function syncLegistarMeetings(): Promise<SyncResult> {
  const { lookback, lookahead } = getSyncWindow();
  const filter = `EventDate ge datetime'${formatLegistarDate(lookback)}' and EventDate le datetime'${formatLegistarDate(lookahead)}'`;

  const events = await fetchLegistarEvents(filter);
  const db = getDb();

  let upserted = 0;
  let withVideo = 0;
  let videosUpdated = 0;
  let videosInserted = 0;
  let videosPreserved = 0;

  for (const event of events) {
    const startAt = parseLegistarStartAt(event.EventDate, event.EventTime);
    const status = isCanceled(event) ? 'canceled' : 'scheduled';
    const title = eventTitle(event);
    const agendaUrl = event.EventAgendaFile ?? null;

    const [row] = await db
      .insert(meetings)
      .values({
        body: event.EventBodyName,
        title,
        startAt,
        source: 'legistar',
        sourceId: event.EventId,
        sourceUrl: event.EventInSiteURL,
        agendaUrl,
        location: event.EventLocation,
        status,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: meetings.sourceId,
        set: {
          body: event.EventBodyName,
          title,
          startAt,
          sourceUrl: event.EventInSiteURL,
          agendaUrl,
          location: event.EventLocation,
          status,
          syncedAt: new Date(),
        },
      })
      .returning({ id: meetings.id });

    upserted += 1;

    const video = videoFromEvent(event);
    const videoResult = await syncMeetingVideo(row.id, video);

    if (video) withVideo += 1;
    if (videoResult === 'updated') videosUpdated += 1;
    if (videoResult === 'inserted') videosInserted += 1;
    if (videoResult === 'preserved') videosPreserved += 1;

    await db.delete(meetingFiles).where(eq(meetingFiles.meetingId, row.id));
    const files = filesFromEvent(event);
    if (files.length > 0) {
      await db.insert(meetingFiles).values(
        files.map((f) => ({
          meetingId: row.id,
          type: f.type,
          url: f.url,
          name: f.name,
        })),
      );
    }
  }

  return {
    fetched: events.length,
    upserted,
    withVideo,
    videosUpdated,
    videosInserted,
    videosPreserved,
    window: {
      lookback: lookback.toISODate() ?? '',
      lookahead: lookahead.toISODate() ?? '',
    },
  };
}
