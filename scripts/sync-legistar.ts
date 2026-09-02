#!/usr/bin/env tsx
import 'dotenv/config';
import { syncLegistarMeetings } from '../src/lib/legistar/sync';

async function main() {
  const result = await syncLegistarMeetings();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
