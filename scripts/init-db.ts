import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
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
      source_id integer NOT NULL,
      source_url text,
      agenda_url text,
      location text,
      status text NOT NULL DEFAULT 'scheduled',
      synced_at timestamptz DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS meetings_source_id_idx ON meetings (source_id)`;
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
  await sql`CREATE INDEX IF NOT EXISTS meeting_videos_meeting_idx ON meeting_videos (meeting_id)`;

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

  console.log('Database schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
