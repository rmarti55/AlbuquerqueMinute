#!/usr/bin/env tsx
/**
 * Safe ALTER: meetings.source_id integer → text, unique (source, source_id).
 * Does not DROP tables. Refuses Santa Fe Neon.
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { assertNotSantaFeDatabase } from '../src/lib/db/assert-not-sfm';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

try {
  assertNotSantaFeDatabase(url, 'DATABASE_URL (migrate-source-id)');
} catch (err) {
  console.error('REFUSED:', err instanceof Error ? err.message : err);
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const sql = neon(url);

async function main() {
  const cols = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetings' AND column_name = 'source_id'
  `;
  const dataType = cols[0]?.data_type as string | undefined;
  console.log(`meetings.source_id current type: ${dataType ?? 'missing'}`);

  if (!APPLY) {
    console.log('Dry run — would ALTER source_id to text and recreate unique index. Re-run with --apply.');
    return;
  }

  if (!dataType) {
    console.error('meetings.source_id column not found');
    process.exit(1);
  }

  if (dataType !== 'text' && dataType !== 'character varying') {
    await sql`ALTER TABLE meetings ALTER COLUMN source_id TYPE text USING source_id::text`;
    console.log('Altered meetings.source_id to text');
  } else {
    console.log('source_id already text');
  }

  await sql`DROP INDEX IF EXISTS meetings_source_id_idx`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS meetings_source_source_id_idx ON meetings (source, source_id)`;
  console.log('Unique index meetings_source_source_id_idx ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
