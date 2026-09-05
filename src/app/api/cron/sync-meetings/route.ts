import { NextRequest, NextResponse } from 'next/server';
import { cronAuthFailure } from '@/lib/cron-auth';
import { syncAllMeetings } from '@/lib/sync/all';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const denied = cronAuthFailure(request);
  if (denied) return denied;

  try {
    const result = await syncAllMeetings();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
