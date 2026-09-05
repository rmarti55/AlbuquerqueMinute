#!/usr/bin/env tsx
/**
 * Build meeting rosters and resolved transcripts for completed STT rows.
 * Does not call Deepgram. Safe to re-run; preserves admin locks.
 */
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { getDb, meetingTranscripts } from '../src/lib/db';
import { resolveAndPersistMeeting } from '../src/lib/speakers/apply';

config({ path: '.env.local' });

async function main() {
  const meetingArg = process.argv.find((arg, i) => process.argv[i - 1] === '--meeting-id');
  const db = getDb();

  if (meetingArg) {
    const meetingId = Number.parseInt(meetingArg, 10);
    if (!Number.isFinite(meetingId)) throw new Error('Invalid --meeting-id');
    const result = await resolveAndPersistMeeting(meetingId, { refreshRoster: true });
    if (!result) throw new Error(`No completed segments for meeting ${meetingId}`);
    console.log(
      `[resolve] meeting ${meetingId}: ${result.mappings.filter((m) => m.resolvedName).length}/${result.mappings.length} named`,
    );
    return;
  }

  const rows = await db
    .select({ meetingId: meetingTranscripts.meetingId })
    .from(meetingTranscripts)
    .where(eq(meetingTranscripts.status, 'completed'));

  for (const row of rows) {
    const result = await resolveAndPersistMeeting(row.meetingId, { refreshRoster: true });
    if (!result) {
      console.log(`[resolve] meeting ${row.meetingId}: skipped (no segments)`);
      continue;
    }
    console.log(
      `[resolve] meeting ${row.meetingId}: ${result.mappings.filter((m) => m.resolvedName).length}/${result.mappings.length} named`,
    );
  }
}

main().catch((err) => {
  console.error('[resolve] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
