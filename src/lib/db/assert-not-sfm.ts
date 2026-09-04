/**
 * Refuse Santa Fe Minutes Neon — ABQ must never touch SFM's meeting_videos (Sep 2026).
 */

export const SFM_NEON_HOST_MARKERS = ['ep-ancient-cell-', 'fancy-wildflower'];

export function parseDatabaseHost(dbUrl: string): string {
  try {
    return new URL(dbUrl.replace(/^postgres(ql)?:/, 'http:')).hostname;
  } catch {
    return '';
  }
}

/** Throws if DATABASE_URL points at Santa Fe Minutes Neon. */
export function assertNotSantaFeDatabase(
  dbUrl: string | undefined | null,
  context = 'DATABASE_URL',
): void {
  const url = dbUrl?.trim();
  if (!url) throw new Error(`${context} is not set`);

  const host = parseDatabaseHost(url);
  if (SFM_NEON_HOST_MARKERS.some((m) => host.includes(m))) {
    throw new Error(
      `${context} looks like Santa Fe Minutes Neon (ep-ancient-cell / fancy-wildflower). ` +
        'Use ABQ Neon (ep-blue-sky / empty-poetry) only.',
    );
  }
}

/** Throws if meeting_videos already has Santa Fe schema (event_id, no meeting_id). */
export async function assertNotSantaFeMeetingVideosSchema(
  sql: { (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> },
): Promise<void> {
  const cols = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meeting_videos'
  `) as { column_name: string }[];
  const names = cols.map((c) => c.column_name);
  if (names.includes('event_id') && !names.includes('meeting_id')) {
    throw new Error(
      'meeting_videos has Santa Fe Minutes schema (event_id). Wrong database.',
    );
  }
}
