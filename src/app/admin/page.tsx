import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getSyncWindow } from '@/lib/datetime';
import { getMeetingCounts, listMeetingsInWindow } from '@/lib/meetings/list';
import { formatMeetingDateTime } from '@/lib/datetime';
import { SyncButton } from './sync-button';

export const dynamic = 'force-dynamic';

const GRID_COLS =
  'grid-cols-[minmax(0,1.2fr)_12rem_minmax(0,1.3fr)_4.5rem_3.5rem_5rem_4.5rem_4rem]';

function sourceLabel(source: string): string {
  if (source === 'legistar') return 'cabq';
  if (source === 'legistar_abcwua') return 'water';
  if (source === 'clerk_board') return 'board';
  return source;
}

const linkClass =
  'text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500';

function EmptyCell() {
  return <span className="text-zinc-300">—</span>;
}

export default async function AdminPage() {
  const { lookback, lookahead } = getSyncWindow();
  let rows: Awaited<ReturnType<typeof listMeetingsInWindow>> = [];
  let counts = { total: 0, withVideo: 0, upcoming: 0, transcribed: 0 };
  let dbError: string | null = null;

  try {
    rows = await listMeetingsInWindow();
    counts = await getMeetingCounts();
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Database error';
  }

  return (
    <main className="w-full px-6 py-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">The Albuquerque Minute</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Meetings · {lookback.toFormat('MMM d')} – {lookahead.toFormat('MMM d, yyyy')} (Denver)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncButton />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      {dbError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Database not connected</p>
          <p className="mt-1">{dbError}</p>
          <p className="mt-2 text-amber-800">
            Set <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> in{' '}
            <code className="rounded bg-amber-100 px-1">.env.local</code>, then run{' '}
            <code className="rounded bg-amber-100 px-1">npm run db:push</code>.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-zinc-600">
            <span>
              <strong className="text-zinc-900">{counts.total}</strong> meetings
            </span>
            <span>
              <strong className="text-zinc-900">{counts.withVideo}</strong> with video
            </span>
            <span>
              <strong className="text-zinc-900">{counts.upcoming}</strong> upcoming
            </span>
            <span>
              <strong className="text-zinc-900">{counts.transcribed}</strong> transcribed
            </span>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white text-sm shadow-sm">
            <div
              className={`grid ${GRID_COLS} items-center gap-x-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs uppercase tracking-wide text-zinc-500`}
            >
              <div className="font-medium">Body</div>
              <div className="whitespace-nowrap font-medium">Date</div>
              <div className="font-medium">Title</div>
              <div className="whitespace-nowrap font-medium">Source</div>
              <div className="whitespace-nowrap font-medium">Video</div>
              <div className="whitespace-nowrap font-medium">Transcript</div>
              <div className="whitespace-nowrap font-medium">Page</div>
              <div className="whitespace-nowrap font-medium">Agenda</div>
            </div>

            {rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500">
                No meetings in window. Run Sync meetings.
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className={`grid ${GRID_COLS} items-center gap-x-4 border-b border-zinc-100 px-4 py-2.5 last:border-b-0 hover:bg-zinc-50/80`}
                >
                  <div
                    className="min-w-0 truncate font-medium text-zinc-800"
                    title={row.body}
                  >
                    {row.body}
                  </div>
                  <div className="whitespace-nowrap text-zinc-600">
                    {formatMeetingDateTime(row.startAt)}
                  </div>
                  <div className="min-w-0 text-zinc-700" title={row.title}>
                    {row.title}
                  </div>
                  <div className="whitespace-nowrap font-mono text-[11px] text-zinc-500">
                    {sourceLabel(row.source)}
                  </div>
                  <div className="whitespace-nowrap">
                    {row.playerUrl ? (
                      <Link
                        href={row.playerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                          row.granicusClipId
                            ? `Granicus clip ${row.granicusClipId}`
                            : row.youtubeId
                              ? `YouTube ${row.youtubeId}`
                              : 'Watch recording'
                        }
                        className="font-mono text-xs text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        {row.granicusClipId ?? (row.youtubeId ? 'YT' : 'Watch')}
                      </Link>
                    ) : (
                      <EmptyCell />
                    )}
                  </div>
                  <div className="whitespace-nowrap">
                    {row.transcriptStatus === 'completed' ? (
                      <Link href={`/admin/meetings/${row.id}`} className={linkClass}>
                        Copy
                      </Link>
                    ) : row.transcriptStatus === 'processing' ? (
                      <span className="text-xs text-amber-700">Running…</span>
                    ) : row.transcriptStatus === 'failed' ? (
                      <span
                        className="text-xs text-red-700"
                        title={row.transcriptError ?? 'Transcription failed'}
                      >
                        Failed
                      </span>
                    ) : (
                      <EmptyCell />
                    )}
                  </div>
                  <div className="whitespace-nowrap">
                    {row.sourceUrl ? (
                      <Link
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        View
                      </Link>
                    ) : (
                      <EmptyCell />
                    )}
                  </div>
                  <div className="whitespace-nowrap">
                    {row.agendaUrl ? (
                      <Link
                        href={row.agendaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        PDF
                      </Link>
                    ) : (
                      <EmptyCell />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
