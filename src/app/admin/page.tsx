import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getSyncWindow } from '@/lib/datetime';
import { getMeetingCounts, listMeetingsInWindow } from '@/lib/meetings/list';
import { formatMeetingDateTime } from '@/lib/datetime';
import { SyncButton } from './sync-button';

export const dynamic = 'force-dynamic';

const linkClass =
  'text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500';

function EmptyCell() {
  return <span className="text-zinc-300">—</span>;
}

export default async function AdminPage() {
  const { lookback, lookahead } = getSyncWindow();
  let rows: Awaited<ReturnType<typeof listMeetingsInWindow>> = [];
  let counts = { total: 0, withVideo: 0, upcoming: 0 };
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
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-44" />
                <col />
                <col className="w-[4.5rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-20" />
                <col className="w-[4.5rem]" />
              </colgroup>
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Body</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Video</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Transcript</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Legistar</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Agenda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      No meetings in window. Run sync from Legistar.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-50/80">
                      <td className="whitespace-nowrap px-4 py-3 align-middle font-medium text-zinc-800">
                        {row.body}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle text-zinc-600">
                        {formatMeetingDateTime(row.startAt)}
                      </td>
                      <td className="px-4 py-3 align-middle text-zinc-700">{row.title}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        {row.playerUrl ? (
                          <Link
                            href={row.playerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={
                              row.granicusClipId
                                ? `Granicus clip ${row.granicusClipId}`
                                : 'Watch recording'
                            }
                            className="font-mono text-xs text-zinc-700 hover:text-zinc-900 hover:underline"
                          >
                            {row.granicusClipId ?? 'Watch'}
                          </Link>
                        ) : (
                          <EmptyCell />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle text-zinc-300">
                        <EmptyCell />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
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
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
