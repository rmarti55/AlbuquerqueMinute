import { eq } from 'drizzle-orm';
import { getDb, meetings, meetingTranscripts } from '@/lib/db';
import { fetchCouncilOfficeRecordsSafe } from '@/lib/legistar/office-records';
import { buildMeetingRoster, parseRosterJson, serializeRoster } from '@/lib/roster/build';
import type { MeetingRoster } from '@/lib/roster/types';
import {
  locksFromMappings,
  parseSegmentsJson,
  parseSpeakerMapJson,
  resolveSpeakers,
} from './resolve';
import type { SpeakerLock, SpeakerMapping } from './types';

export async function rosterForMeeting(
  meeting: { startAt: Date; rosterJson?: string | null },
  options?: { refresh?: boolean },
): Promise<MeetingRoster> {
  if (!options?.refresh) {
    const stored = parseRosterJson(meeting.rosterJson);
    if (stored) return stored;
  }
  const records = await fetchCouncilOfficeRecordsSafe();
  return buildMeetingRoster(meeting.startAt, records);
}

export async function resolveAndPersistMeeting(
  meetingId: number,
  options?: { locks?: SpeakerLock[]; refreshRoster?: boolean },
): Promise<{ mappings: SpeakerMapping[]; resolvedTranscript: string; roster: MeetingRoster } | null> {
  const db = getDb();
  const [meeting] = await db
    .select({
      id: meetings.id,
      startAt: meetings.startAt,
      rosterJson: meetings.rosterJson,
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);
  if (!meeting) return null;

  const [transcript] = await db
    .select()
    .from(meetingTranscripts)
    .where(eq(meetingTranscripts.meetingId, meetingId))
    .limit(1);
  if (!transcript?.segmentsJson) return null;

  const turns = parseSegmentsJson(transcript.segmentsJson);
  if (turns.length === 0) return null;

  const roster = await rosterForMeeting(meeting, { refresh: options?.refreshRoster });
  const existingLocks = locksFromMappings(parseSpeakerMapJson(transcript.speakerMapJson));
  const locks = options?.locks ?? existingLocks;
  const result = resolveSpeakers(turns, roster, locks);

  await db
    .update(meetings)
    .set({ rosterJson: serializeRoster(roster) })
    .where(eq(meetings.id, meetingId));

  await db
    .update(meetingTranscripts)
    .set({
      resolvedTranscript: result.resolvedTranscript,
      speakerMapJson: JSON.stringify(result.mappings),
      updatedAt: new Date(),
    })
    .where(eq(meetingTranscripts.id, transcript.id));

  return { ...result, roster };
}
