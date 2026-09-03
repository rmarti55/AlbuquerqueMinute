import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { granicusPlayerUrl } from '@/lib/legistar/config';

const execFileAsync = promisify(execFile);

export const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
export const DEEPGRAM_USD_PER_MIN = 0.0043;
const DEEPGRAM_TIMEOUT_MS = 45 * 60 * 1000;

export type DeepgramUtterance = {
  start: number;
  end: number;
  transcript: string;
  speaker?: number;
};

export type TranscriptSegment = {
  text: string;
  offset: number;
  duration: number;
  speakerId?: number;
};

export async function requireBinary(name: string): Promise<void> {
  try {
    await execFileAsync(name, ['--version'], { timeout: 10_000 });
  } catch {
    try {
      await execFileAsync('which', [name]);
    } catch {
      throw new Error(`${name} not found on PATH — required for Granicus STT`);
    }
  }
}

export async function fetchHlsUrl(clipId: number): Promise<{ playerUrl: string; hlsUrl: string }> {
  const playerUrl = granicusPlayerUrl(clipId);
  const res = await fetch(playerUrl, {
    headers: { 'User-Agent': CHROME_UA },
  });
  if (!res.ok) {
    throw new Error(`Player fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const match = html.match(/video_url="([^"]+)"/);
  if (!match?.[1]) {
    throw new Error('Could not find video_url in player HTML');
  }
  return { playerUrl, hlsUrl: match[1].replace(/&amp;/g, '&') };
}

export async function downloadGranicusAudio(
  hlsUrl: string,
  playerUrl: string,
  outPath: string,
  options?: { maxMinutes?: number | null },
): Promise<void> {
  const maxMinutes = options?.maxMinutes ?? null;
  const refererHeader = `Referer: ${playerUrl}\r\n`;
  const args = [
    '-y',
    '-user_agent',
    CHROME_UA,
    '-headers',
    refererHeader,
    '-i',
    hlsUrl,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    ...(maxMinutes !== null && maxMinutes !== undefined
      ? ['-t', String(maxMinutes * 60)]
      : []),
    outPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const errBuf: Buffer[] = [];
    child.stderr.on('data', (c: Buffer) => errBuf.push(c));
    child.on('error', (err) => reject(new Error(`ffmpeg spawn failed: ${err.message}`)));
    child.on('close', (code) => {
      if (code === 0) return resolve();
      const stderr = Buffer.concat(errBuf).toString().slice(-500);
      reject(new Error(`ffmpeg exited ${code}: ${stderr}`));
    });
  });
}

function runCurl(args: string[], stdinConfig: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('curl', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    const errBuf: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Deepgram upload (curl) timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (c: Buffer) => out.push(c));
    child.stderr.on('data', (c: Buffer) => errBuf.push(c));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Deepgram upload (curl) spawn failed: ${err.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const stderr = Buffer.concat(errBuf).toString().slice(0, 300);
      const stdout = Buffer.concat(out).toString();
      if (code === 0) return resolve(stdout);
      reject(
        new Error(
          `Deepgram upload (curl) failed (exit ${code}): ${stderr || stdout.slice(0, 300)}`,
        ),
      );
    });
    child.stdin.write(stdinConfig);
    child.stdin.end();
  });
}

export async function transcribeAudio(audioPath: string): Promise<DeepgramUtterance[]> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY missing — set it in .env.local');
  }

  const params = new URLSearchParams({
    model: 'nova-2',
    smart_format: 'true',
    punctuate: 'true',
    utterances: 'true',
    diarize: 'true',
  });

  const maxTimeSec = Math.floor(DEEPGRAM_TIMEOUT_MS / 1000);
  const stdout = await runCurl(
    [
      '-sS',
      '--fail-with-body',
      '--max-time',
      String(maxTimeSec),
      '--retry',
      '2',
      '--retry-all-errors',
      '-X',
      'POST',
      '-H',
      'Content-Type: audio/mpeg',
      '--data-binary',
      `@${audioPath}`,
      '--config',
      '-',
      `https://api.deepgram.com/v1/listen?${params}`,
    ],
    `header = "Authorization: Token ${apiKey}"\n`,
    DEEPGRAM_TIMEOUT_MS + 30_000,
  );

  const json = JSON.parse(stdout) as {
    results?: {
      utterances?: Array<{ start: number; end: number; transcript: string; speaker?: number }>;
    };
  };

  return (json.results?.utterances ?? [])
    .filter((u) => u.transcript?.trim())
    .map((u) => ({
      start: u.start,
      end: u.end,
      transcript: u.transcript.trim(),
      speaker:
        u.speaker !== undefined && u.speaker !== null && Number.isFinite(Number(u.speaker))
          ? Number(u.speaker)
          : undefined,
    }));
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTranscriptForCopy(utterances: DeepgramUtterance[]): string {
  return utterances
    .map((u) => {
      const speaker =
        typeof u.speaker === 'number' ? `Speaker ${u.speaker}` : 'Speaker ?';
      return `[${formatTimestamp(u.start)}] ${speaker}: ${u.transcript}`;
    })
    .join('\n');
}

export function utterancesToSegments(utterances: DeepgramUtterance[]): TranscriptSegment[] {
  return utterances.map((u) => ({
    text: u.transcript,
    offset: Math.round(u.start * 1000),
    duration: Math.max(0, Math.round((u.end - u.start) * 1000)),
    ...(typeof u.speaker === 'number' ? { speakerId: u.speaker } : {}),
  }));
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateDeepgramCost(durationSec: number): number {
  return (durationSec / 60) * DEEPGRAM_USD_PER_MIN;
}
