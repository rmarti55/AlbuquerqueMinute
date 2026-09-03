#!/usr/bin/env tsx
/**
 * Local Granicus STT smoke test — player → HLS → ffmpeg → Deepgram → files.
 * Not for Vercel; no DB writes.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import {
  countWords,
  downloadGranicusAudio,
  estimateDeepgramCost,
  fetchHlsUrl,
  formatTimestamp,
  formatTranscriptForCopy,
  requireBinary,
  transcribeAudio,
} from '../src/lib/granicus/stt';

config({ path: '.env.local' });

const OUT_DIR = join(process.cwd(), 'data', 'stt-smoke');

function parseArgs(): { clipId: number; minutes: number | null } {
  const args = process.argv.slice(2);
  let clipId = 556;
  let minutes: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--clip' && args[i + 1]) {
      clipId = Number.parseInt(args[++i], 10);
    } else if (args[i] === '--minutes' && args[i + 1]) {
      minutes = Number.parseFloat(args[++i]);
    }
  }

  if (!Number.isFinite(clipId) || clipId <= 0) {
    throw new Error('Invalid --clip value');
  }
  if (minutes !== null && (!Number.isFinite(minutes) || minutes <= 0)) {
    throw new Error('Invalid --minutes value');
  }

  return { clipId, minutes };
}

async function main() {
  const { clipId, minutes } = parseArgs();
  const audioPath = join(OUT_DIR, `clip-${clipId}.mp3`);
  const txtPath = join(OUT_DIR, `clip-${clipId}.txt`);
  const jsonPath = join(OUT_DIR, `clip-${clipId}.json`);

  console.log(`[smoke] clip ${clipId}${minutes ? ` (first ${minutes} min)` : ' (full VOD)'}`);

  await requireBinary('ffmpeg');
  await requireBinary('curl');

  mkdirSync(OUT_DIR, { recursive: true });

  console.log('[smoke] fetching player HTML…');
  const { playerUrl, hlsUrl } = await fetchHlsUrl(clipId);
  console.log(`[smoke] player: ${playerUrl}`);
  console.log(`[smoke] HLS: ${hlsUrl.slice(0, 80)}…`);

  console.log('[smoke] downloading audio with ffmpeg…');
  await downloadGranicusAudio(hlsUrl, playerUrl, audioPath, { maxMinutes: minutes });

  console.log('[smoke] transcribing with Deepgram nova-2…');
  const utterances = await transcribeAudio(audioPath);
  if (utterances.length === 0) {
    throw new Error('Deepgram returned no utterances');
  }

  const fullText = utterances.map((u) => u.transcript).join(' ');
  const durationSec = utterances[utterances.length - 1]?.end ?? 0;
  const wordCount = countWords(fullText);
  const costUsd = estimateDeepgramCost(durationSec);
  const transcriptText = formatTranscriptForCopy(utterances);

  writeFileSync(txtPath, transcriptText, 'utf8');
  writeFileSync(jsonPath, JSON.stringify({ clipId, playerUrl, hlsUrl, utterances }, null, 2), 'utf8');

  try {
    rmSync(audioPath);
  } catch {
    /* ignore */
  }

  console.log('\n--- results ---');
  console.log(`duration: ${formatTimestamp(durationSec)} (${durationSec.toFixed(1)}s)`);
  console.log(`utterances: ${utterances.length}`);
  console.log(`words: ${wordCount}`);
  console.log(`estimated cost: $${costUsd.toFixed(4)}`);
  console.log(`wrote: ${txtPath}`);
  console.log(`wrote: ${jsonPath}`);
  console.log('\n--- preview (first ~500 chars) ---');
  console.log(transcriptText.slice(0, 500) + (transcriptText.length > 500 ? '…' : ''));
}

main().catch((err) => {
  console.error('[smoke] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
