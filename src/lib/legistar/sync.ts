import { eq } from 'drizzle-orm';
import { getDb, meetings, meetingVideos, meetingFiles } from '@/lib/db';
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
  window: { lookback: string; lookahead: string };
}

export async function syncLegistarMeetings(): Promise<SyncResult> {
  const { lookback, lookahead } = getSyncWindow();
  const filter = `EventDate ge datetime'${formatLegistarDate(lookback)}' and EventDate le datetime'${formatLegistarDate(lookahead)}'`;

  const events = await fetchLegistarEvents(filter);
  const db = getDb();

  let upserted = 0;
  let withVideo = 0;

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
    await db.delete(meetingVideos).where(eq(meetingVideos.meetingId, row.id));

    if (video) {
      withVideo += 1;
      await db.insert(meetingVideos).values({
        meetingId: row.id,
        granicusClipId: video.granicusClipId,
        playerUrl: video.playerUrl,
        matchMethod: video.matchMethod,
      });
    }

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
    window: {
      lookback: lookback.toISODate() ?? '',
      lookahead: lookahead.toISODate() ?? '',
    },
  };
}
