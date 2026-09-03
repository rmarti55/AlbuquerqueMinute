import { eq } from 'drizzle-orm';
import { getDb, meetingTranscripts } from '@/lib/db';
import type { TranscriptSegment } from '@/lib/granicus/stt';

export function serializeSegments(segments: TranscriptSegment[]): string {
  return JSON.stringify(segments);
}

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
  const existing = await getTranscriptByVideoId(videoId);

  if (existing) {
    await db
      .update(meetingTranscripts)
      .set({
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
  data: { rawTranscript: string; segmentsJson: string },
): Promise<void> {
  const db = getDb();
  await db
    .update(meetingTranscripts)
    .set({
      status: 'completed',
      rawTranscript: data.rawTranscript,
      segmentsJson: data.segmentsJson,
      transcriptSource: 'stt',
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(meetingTranscripts.id, transcriptId));
}

export async function markTranscriptFailed(
  transcriptId: number,
  errorMessage: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(meetingTranscripts)
    .set({
      status: 'failed',
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(meetingTranscripts.id, transcriptId));
}
