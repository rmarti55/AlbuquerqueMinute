#!/usr/bin/env tsx
import { config } from 'dotenv';
import { syncAllMeetings } from '../src/lib/sync/all';

config({ path: '.env.local' });

async function main() {
  const result = await syncAllMeetings();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
