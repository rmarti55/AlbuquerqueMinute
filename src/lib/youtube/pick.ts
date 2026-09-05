import type { YoutubeCatalogEntry } from './catalog';

const STOP = new Set([
  'the',
  'and',
  'of',
  'for',
  'a',
  'to',
  'meeting',
  'meetings',
  'committee',
  'commission',
  'board',
  'advisory',
  'city',
  'albuquerque',
]);

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

const ALIASES: Record<string, string[]> = {
  'civilian police oversight advisory board': ['cpoa', 'cpoab', 'oversight'],
  'environmental planning commission': ['epc'],
  'zoning hearing examiner': ['zhe'],
  'development hearing officer': ['dho'],
  'landmarks commission': ['landmarks', 'landmark'],
  'intergovernmental legislative relations committee': ['ilr', 'intergovernmental'],
  'finance government operations committee': ['fgo'],
  'land use planning and zoning committee': ['lupz'],
};

function score(entry: YoutubeCatalogEntry, body: string): number {
  const titleTok = tokens(entry.title);
  const bodyTok = tokens(body);
  const extra = ALIASES[body.toLowerCase()] ?? [];
  let hits = 0;
  for (const t of bodyTok) {
    if (titleTok.has(t)) hits += 1;
  }
  for (const alias of extra) {
    if (entry.title.toLowerCase().includes(alias)) hits += 2;
  }
  return hits;
}

function sameDay(a: Date, b: Date): boolean {
  return Math.abs(a.getTime() - b.getTime()) <= 36 * 60 * 60 * 1000;
}

export function pickMatch(
  entry: YoutubeCatalogEntry,
  candidates: Array<{ id: number; body: string; startAt: Date }>,
): { id: number; body: string; startAt: Date } | null {
  if (!entry.meetingDate) return null;
  const dated = candidates.filter((c) => sameDay(c.startAt, entry.meetingDate!));
  if (dated.length === 0) return null;
  let best = dated[0];
  let bestScore = score(entry, best.body);
  for (const c of dated.slice(1)) {
    const s = score(entry, c.body);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  if (bestScore < 1 && dated.length > 1) return null;
  return bestScore >= 1 || dated.length === 1 ? best : null;
}
