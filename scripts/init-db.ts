import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import {
  assertNotSantaFeDatabase,
  assertNotSantaFeMeetingVideosSchema,
} from '../src/lib/db/assert-not-sfm';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

try {
  assertNotSantaFeDatabase(url, 'DATABASE_URL (init-db)');
} catch (err) {
  console.error('REFUSED:', err instanceof Error ? err.message : err);
  console.error('ABQ init-db DROPs meeting_videos. Use ABQ Neon (ep-blue-sky / empty-poetry) only.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const sql = neon(url);

async function main() {
  try {
    await assertNotSantaFeMeetingVideosSchema(sql);
  } catch (err) {
    console.error('REFUSED:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  if (!APPLY) {
    console.log('Dry run — would DROP and recreate ABQ tables. Re-run with --apply.');
    return;
  }

  await sql`DROP TABLE IF EXISTS meeting_transcripts CASCADE`;
  await sql`DROP TABLE IF EXISTS meeting_files CASCADE`;
  await sql`DROP TABLE IF EXISTS meeting_videos CASCADE`;
  await sql`DROP TABLE IF EXISTS meetings CASCADE`;

  await sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id serial PRIMARY KEY,
      body text NOT NULL,
      title text NOT NULL,
      start_at timestamptz NOT NULL,
      source text NOT NULL DEFAULT 'legistar',
      source_id text NOT NULL,
      source_url text,
      agenda_url text,
      location text,
      status text NOT NULL DEFAULT 'scheduled',
      roster_json text,
      synced_at timestamptz DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS meetings_source_source_id_idx ON meetings (source, source_id)`;
  await sql`CREATE INDEX IF NOT EXISTS meetings_start_at_idx ON meetings (start_at)`;
  await sql`CREATE INDEX IF NOT EXISTS meetings_body_idx ON meetings (body)`;

  await sql`
    CREATE TABLE IF NOT EXISTS meeting_videos (
      id serial PRIMARY KEY,
      meeting_id integer NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      granicus_clip_id integer,
      youtube_id text,
      player_url text,
      match_method text NOT NULL DEFAULT 'legistar_event_media',
      matched_at timestamptz DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS meeting_videos_meeting_idx ON meeting_videos (meeting_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS meeting_files (
      id serial PRIMARY KEY,
      meeting_id integer NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      type text NOT NULL,
      url text NOT NULL,
      name text
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS meeting_files_meeting_idx ON meeting_files (meeting_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS meeting_transcripts (
      id serial PRIMARY KEY,
      meeting_id integer NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      video_id integer REFERENCES meeting_videos(id) ON DELETE SET NULL,
      raw_transcript text,
      resolved_transcript text,
      segments_json text,
      speaker_map_json text,
      status text NOT NULL DEFAULT 'pending',
      transcript_source text,
      error_message text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS meeting_transcripts_meeting_idx ON meeting_transcripts (meeting_id)`;
  await sql`CREATE INDEX IF NOT EXISTS meeting_transcripts_status_idx ON meeting_transcripts (status)`;

  console.log('Database schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
