import { NextRequest, NextResponse } from 'next/server';

export function cronAuthFailure(request: NextRequest): NextResponse | null {
  const secret =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.nextUrl.searchParams.get('secret');
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not set' },
      { status: 503 },
    );
  }

  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
