/**
 * YouTube audio download — NOT INVOKED by cron or admin sync.
 * Wire this into the STT CLI only when we are ready to run Deepgram.
 *
 * Expected later recipe (local worker, not Vercel):
 *   yt-dlp -x --audio-format mp3 -o data/stt-audio/yt-{id}.mp3 -- {youtubeId}
 *   then reuse transcribeAudio() from src/lib/granicus/stt.ts
 */
export function downloadYoutubeAudio(_youtubeId: string): never {
  throw new Error(
    'YouTube audio download is not enabled. Do not run STT against YouTube yet.',
  );
}
