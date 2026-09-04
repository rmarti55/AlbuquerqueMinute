import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { assertNotSantaFeDatabase } from './assert-not-sfm';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is not set');
  assertNotSantaFeDatabase(url);
  return url;
}

export function getDb() {
  const sql = neon(getDatabaseUrl());
  return drizzle(sql, { schema });
}

export * from './schema';
