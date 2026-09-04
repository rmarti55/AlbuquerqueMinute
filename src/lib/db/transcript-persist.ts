import { eq } from 'drizzle-orm';
import { getDb, meetingTranscripts } from '@/lib/db';
import type { TranscriptSegment } from '@/lib/granicus/stt';

export function serializeSegments(segments: TranscriptSegment[]): string {
  return JSON.stringify(segments);
}

export async function getTranscriptByMeetingId(meetingId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(meetingTranscripts)
    .where(eq(meetingTranscripts.meetingId, meetingId))
    .limit(1);
  return rows[0] ?? null;
}

/** @deprecated Prefer getTranscriptByMeetingId — video rows can churn during sync. */
export async function getTranscriptByVideoId(videoId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(meetingTranscripts)
    .where(eq(meetingTranscripts.videoId, videoId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertTranscriptProcessing(
  meetingId: number,
  videoId: number,
): Promise<number> {
  const db = getDb();
  const existing = await getTranscriptByMeetingId(meetingId);

  if (existing) {
    await db
      .update(meetingTranscripts)
      .set({
        videoId,
        status: 'processing',
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(meetingTranscripts.id, existing.id));
    return existing.id;
  }

  const inserted = await db
    .insert(meetingTranscripts)
    .values({
      meetingId,
      videoId,
      status: 'processing',
      transcriptSource: 'stt',
    })
    .returning({ id: meetingTranscripts.id });

  return inserted[0].id;
}

export async function markTranscriptCompleted(
  transcriptId: number,
  meetingId: number,
  videoId: number,
  data: { rawTranscript: string; segmentsJson: string },
): Promise<number> {
  const db = getDb();
  const payload = {
    status: 'completed' as const,
    rawTranscript: data.rawTranscript,
    segmentsJson: data.segmentsJson,
    transcriptSource: 'stt',
    errorMessage: null,
    videoId,
    updatedAt: new Date(),
  };

  const updated = await db
    .update(meetingTranscripts)
    .set(payload)
    .where(eq(meetingTranscripts.id, transcriptId))
    .returning({ id: meetingTranscripts.id });

  if (updated.length > 0) return updated[0].id;

  const existing = await getTranscriptByMeetingId(meetingId);
  if (existing) {
    await db
      .update(meetingTranscripts)
      .set(payload)
      .where(eq(meetingTranscripts.id, existing.id));
    return existing.id;
  }

  const inserted = await db
    .insert(meetingTranscripts)
    .values({
      meetingId,
      videoId,
      ...payload,
    })
    .returning({ id: meetingTranscripts.id });

  return inserted[0].id;
}

export async function markTranscriptFailed(
  transcriptId: number,
  meetingId: number,
  videoId: number,
  errorMessage: string,
): Promise<number> {
  const db = getDb();
  const payload = {
    status: 'failed' as const,
    errorMessage,
    videoId,
    updatedAt: new Date(),
  };

  const updated = await db
    .update(meetingTranscripts)
    .set(payload)
    .where(eq(meetingTranscripts.id, transcriptId))
    .returning({ id: meetingTranscripts.id });

  if (updated.length > 0) return updated[0].id;

  const existing = await getTranscriptByMeetingId(meetingId);
  if (existing) {
    await db
      .update(meetingTranscripts)
      .set(payload)
      .where(eq(meetingTranscripts.id, existing.id));
    return existing.id;
  }

  const inserted = await db
    .insert(meetingTranscripts)
    .values({
      meetingId,
      videoId,
      ...payload,
      transcriptSource: 'stt',
    })
    .returning({ id: meetingTranscripts.id });

  return inserted[0].id;
}
