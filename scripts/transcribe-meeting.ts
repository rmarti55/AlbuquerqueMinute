#!/usr/bin/env tsx
/**
 * Full Granicus STT → meeting_transcripts. Worker-host / local CLI only.
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import {
  countWords,
  databaseHostHint,
  downloadGranicusAudio,
  estimateDeepgramCost,
  fetchHlsUrl,
  formatTimestamp,
  formatTranscriptForCopy,
  granicusAudioCachePath,
  requireBinary,
  requireSttEnv,
  transcribeAudio,
  utterancesToSegments,
} from '../src/lib/granicus/stt';
import { getDb, meetingVideos, meetings } from '../src/lib/db';
import {
  getTranscriptByVideoId,
  markTranscriptCompleted,
  markTranscriptFailed,
  serializeSegments,
  upsertTranscriptProcessing,
} from '../src/lib/db/transcript-persist';

config({ path: '.env.local' });

const AUDIO_DIR = join(process.cwd(), 'data', 'stt-audio');

type Args = {
  meetingId: number | null;
  clipId: number | null;
  minutes: number | null;
  force: boolean;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let meetingId: number | null = null;
  let clipId: number | null = null;
  let minutes: number | null = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--meeting-id' && args[i + 1]) {
      meetingId = Number.parseInt(args[++i], 10);
    } else if (args[i] === '--clip' && args[i + 1]) {
      clipId = Number.parseInt(args[++i], 10);
    } else if (args[i] === '--minutes' && args[i + 1]) {
      minutes = Number.parseFloat(args[++i]);
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  if (meetingId === null && clipId === null) {
    throw new Error('Provide --meeting-id or --clip');
  }
  if (meetingId !== null && !Number.isFinite(meetingId)) {
    throw new Error('Invalid --meeting-id');
  }
  if (clipId !== null && !Number.isFinite(clipId)) {
    throw new Error('Invalid --clip');
  }
  if (minutes !== null && (!Number.isFinite(minutes) || minutes <= 0)) {
    throw new Error('Invalid --minutes');
  }

  return { meetingId, clipId, minutes, force };
}

async function resolveMeeting(args: Args) {
  const db = getDb();

  if (args.meetingId !== null) {
    const rows = await db
      .select({
        meetingId: meetings.id,
        body: meetings.body,
        title: meetings.title,
        videoId: meetingVideos.id,
        granicusClipId: meetingVideos.granicusClipId,
        playerUrl: meetingVideos.playerUrl,
      })
      .from(meetings)
      .innerJoin(meetingVideos, eq(meetingVideos.meetingId, meetings.id))
      .where(eq(meetings.id, args.meetingId))
      .limit(1);

    const row = rows[0];
    if (!row) throw new Error(`Meeting ${args.meetingId} has no video row`);
    if (!row.granicusClipId) throw new Error(`Meeting ${args.meetingId} has no Granicus clip`);
    return row;
  }

  const rows = await db
    .select({
      meetingId: meetings.id,
      body: meetings.body,
      title: meetings.title,
      videoId: meetingVideos.id,
      granicusClipId: meetingVideos.granicusClipId,
      playerUrl: meetingVideos.playerUrl,
    })
    .from(meetingVideos)
    .innerJoin(meetings, eq(meetings.id, meetingVideos.meetingId))
    .where(eq(meetingVideos.granicusClipId, args.clipId!))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error(`No meeting found for Granicus clip ${args.clipId}`);
  return row;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  requireSttEnv();
  const args = parseArgs();

  await requireBinary('ffmpeg');
  await requireBinary('curl');

  console.log(`[stt] database ${databaseHostHint()}`);

  const meeting = await resolveMeeting(args);

  const existing = await getTranscriptByVideoId(meeting.videoId);
  if (existing?.status === 'completed' && !args.force) {
    console.log(
      `[stt] transcript already completed for meeting ${meeting.meetingId} (video ${meeting.videoId}) — use --force to re-run`,
    );
    return;
  }

  const clipId = meeting.granicusClipId!;
  mkdirSync(AUDIO_DIR, { recursive: true });
  const audioPath = granicusAudioCachePath(clipId);

  const transcriptId = await upsertTranscriptProcessing(meeting.meetingId, meeting.videoId);
  console.log(`[stt] transcript id=${transcriptId} status=processing`);

  console.log(`[stt] meeting ${meeting.meetingId} · clip ${clipId} · ${meeting.title}`);
  if (args.minutes) console.log(`[stt] limiting to first ${args.minutes} minutes`);

  let downloaded = false;

  try {
    const cacheExists = existsSync(audioPath);
    const useCache = cacheExists && !args.force && args.minutes === null;

    if (useCache) {
      const bytes = statSync(audioPath).size;
      console.log(`[stt] using cached audio ${audioPath} (${formatBytes(bytes)})`);
    } else {
      console.log('[stt] fetching player HTML…');
      const { playerUrl, hlsUrl } = await fetchHlsUrl(clipId);
      console.log(`[stt] HLS: ${hlsUrl.slice(0, 80)}…`);
      console.log(`[stt] downloading audio → ${audioPath}`);
      await downloadGranicusAudio(hlsUrl, playerUrl, audioPath, {
        maxMinutes: args.minutes,
      });
      downloaded = true;
      console.log(`[stt] download complete (${formatBytes(statSync(audioPath).size)})`);
    }

    console.log('[stt] transcribing with Deepgram nova-2…');
    const utterances = await transcribeAudio(audioPath);
    if (utterances.length === 0) {
      throw new Error('Deepgram returned no utterances');
    }

    const rawTranscript = formatTranscriptForCopy(utterances);
    const segmentsJson = serializeSegments(utterancesToSegments(utterances));
    await markTranscriptCompleted(transcriptId, { rawTranscript, segmentsJson });

    const durationSec = utterances[utterances.length - 1]?.end ?? 0;
    const wordCount = countWords(utterances.map((u) => u.transcript).join(' '));
    const costUsd = estimateDeepgramCost(durationSec);

    console.log('\n--- results ---');
    console.log(`transcript id: ${transcriptId}`);
    console.log(`duration: ${formatTimestamp(durationSec)} (${durationSec.toFixed(1)}s)`);
    console.log(`utterances: ${utterances.length}`);
    console.log(`words: ${wordCount}`);
    console.log(`estimated cost: $${costUsd.toFixed(4)}`);
    console.log(`view: /admin/meetings/${meeting.meetingId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markTranscriptFailed(transcriptId, message);
    if (downloaded || existsSync(audioPath)) {
      console.error(`[stt] partial audio kept at ${audioPath}`);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error('[stt] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
