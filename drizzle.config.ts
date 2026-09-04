import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { assertNotSantaFeDatabase } from './src/lib/db/assert-not-sfm';

config({ path: '.env.local' });
assertNotSantaFeDatabase(process.env.DATABASE_URL, 'DATABASE_URL (drizzle-kit)');

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
