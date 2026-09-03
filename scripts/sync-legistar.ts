#!/usr/bin/env tsx
import { config } from 'dotenv';
import { syncLegistarMeetings } from '../src/lib/legistar/sync';

config({ path: '.env.local' });

async function main() {
  const result = await syncLegistarMeetings();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
