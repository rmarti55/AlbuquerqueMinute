import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';
import { getClerkUserEmail } from '@/lib/auth';
import { getTranscriptByMeetingId } from '@/lib/db/transcript-persist';
import { allRosterPeople } from '@/lib/roster/types';
import { resolveAndPersistMeeting } from '@/lib/speakers/apply';
import { locksFromMappings, parseSpeakerMapJson } from '@/lib/speakers/resolve';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const email = await getClerkUserEmail(userId);
  if (!isAdminEmail(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const meetingId = Number.parseInt((await params).id, 10);
  if (!Number.isFinite(meetingId)) {
    return NextResponse.json({ error: 'Invalid meeting id' }, { status: 400 });
  }

  const body = (await request.json()) as {
    speakerId?: number;
    officialName?: string | null;
    refresh?: boolean;
  };

  const transcript = await getTranscriptByMeetingId(meetingId);
  if (!transcript) {
    return NextResponse.json({ error: 'No transcript' }, { status: 404 });
  }

  const locks = locksFromMappings(parseSpeakerMapJson(transcript.speakerMapJson));
  if (typeof body.speakerId === 'number') {
    const next = locks.filter((lock) => lock.speakerId !== body.speakerId);
    if (body.officialName) next.push({ speakerId: body.speakerId, officialName: body.officialName });
    const result = await resolveAndPersistMeeting(meetingId, { locks: next });
    if (!result) return NextResponse.json({ error: 'Resolve failed' }, { status: 400 });
    return NextResponse.json(result);
  }

  const result = await resolveAndPersistMeeting(meetingId, {
    locks,
    refreshRoster: body.refresh,
  });
  if (!result) return NextResponse.json({ error: 'Resolve failed' }, { status: 400 });
  return NextResponse.json({
    mappings: result.mappings,
    rosterNames: allRosterPeople(result.roster).map((p) => p.name),
  });
}
