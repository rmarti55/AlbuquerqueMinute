import { LEGISTAR_CLIENT } from './config';
import type { LegistarOfficeRecord } from '@/lib/roster/build';

const LEGISTAR_BASE = `https://webapi.legistar.com/v1/${LEGISTAR_CLIENT}`;

export async function fetchCouncilOfficeRecords(): Promise<LegistarOfficeRecord[]> {
  const url = `${LEGISTAR_BASE}/Bodies/1/OfficeRecords`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Legistar office records failed (${res.status})`);
  }
  const data = (await res.json()) as LegistarOfficeRecord[];
  return Array.isArray(data) ? data : [];
}

export async function fetchCouncilOfficeRecordsSafe(): Promise<LegistarOfficeRecord[] | undefined> {
  try {
    return await fetchCouncilOfficeRecords();
  } catch {
    return undefined;
  }
}
