import { describe, expect, it } from 'vitest';
import { assertNotSantaFeDatabase, parseDatabaseHost } from '../assert-not-sfm';

describe('assertNotSantaFeDatabase', () => {
  it('refuses Santa Fe Neon host', () => {
    expect(() =>
      assertNotSantaFeDatabase(
        'postgresql://user:pass@ep-ancient-cell-ah86lry3-pooler.c-3.us-east-1.aws.neon.tech/neondb',
      ),
    ).toThrow(/Santa Fe Minutes/);
  });

  it('allows ABQ Neon host', () => {
    expect(() =>
      assertNotSantaFeDatabase(
        'postgresql://user:pass@ep-blue-sky-ausiekl4-pooler.c-10.us-east-1.aws.neon.tech/neondb',
      ),
    ).not.toThrow();
  });

  it('parses postgres hostnames', () => {
    expect(parseDatabaseHost('postgres://u:p@ep-blue-sky.example.com/db')).toBe('ep-blue-sky.example.com');
  });
});
