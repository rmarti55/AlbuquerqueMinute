import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getSyncWindow } from '@/lib/datetime';
import { getMeetingCounts, listMeetingsInWindow } from '@/lib/meetings/list';
import { formatMeetingDateTime } from '@/lib/datetime';
import { SyncButton } from './sync-button';

export const dynamic = 'force-dynamic';

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
    <main className="mx-auto max-w-6xl px-4 py-8">
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

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Body</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Video</th>
                  <th className="px-4 py-3 font-medium">Transcript</th>
                  <th className="px-4 py-3 font-medium">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No meetings in window. Run sync from Legistar.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3 align-top font-medium text-zinc-800">{row.body}</td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-600">
                        {formatMeetingDateTime(row.startAt)}
                      </td>
                      <td className="max-w-xs px-4 py-3 align-top text-zinc-700">{row.title}</td>
                      <td className="px-4 py-3 align-top">
                        {row.hasVideo ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Yes
                            {row.granicusClipId ? ` · clip ${row.granicusClipId}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-400">—</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1 text-xs">
                          {row.sourceUrl && (
                            <Link
                              href={row.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Legistar
                            </Link>
                          )}
                          {row.agendaUrl && (
                            <Link
                              href={row.agendaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Agenda
                            </Link>
                          )}
                          {row.playerUrl && (
                            <Link
                              href={row.playerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Video
                            </Link>
                          )}
                        </div>
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
