/**
 * CLI guard — run before db:push or other destructive schema commands.
 *
 *   npx tsx scripts/assert-not-sfm-db.ts
 */

import { config } from 'dotenv';
import { assertNotSantaFeDatabase } from '../src/lib/db/assert-not-sfm';

config({ path: '.env.local' });

try {
  assertNotSantaFeDatabase(process.env.DATABASE_URL);
} catch (err) {
  console.error('REFUSED:', err instanceof Error ? err.message : err);
  process.exit(1);
}
