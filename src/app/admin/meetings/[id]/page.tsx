import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMeetingDateTime } from '@/lib/datetime';
import { countWords } from '@/lib/granicus/stt';
import { getMeetingWithTranscript } from '@/lib/meetings/list';
import { CopyButton } from '../copy-button';

export const dynamic = 'force-dynamic';

export default async function AdminMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meetingId = Number.parseInt(id, 10);
  if (!Number.isFinite(meetingId)) notFound();

  const meeting = await getMeetingWithTranscript(meetingId);
  if (!meeting) notFound();

  const wordCount = meeting.rawTranscript ? countWords(meeting.rawTranscript) : 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
      <Link
        href="/admin"
        className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
      >
        ← Back to meetings
      </Link>

      <header className="mt-6 border-b border-zinc-200 pb-6">
        <p className="text-sm font-medium text-zinc-500">{meeting.body}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {meeting.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">{formatMeetingDateTime(meeting.startAt)}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {meeting.playerUrl && (
            <Link
              href={meeting.playerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
            >
              Granicus clip {meeting.granicusClipId ?? 'video'}
            </Link>
          )}
          {meeting.sourceUrl && (
            <Link
              href={meeting.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
            >
              Legistar
            </Link>
          )}
          {meeting.agendaUrl && (
            <Link
              href={meeting.agendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
            >
              Agenda PDF
            </Link>
          )}
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Transcript</h2>
            {meeting.transcriptStatus === 'completed' && meeting.rawTranscript && (
              <p className="mt-1 text-xs text-zinc-500">{wordCount.toLocaleString()} words</p>
            )}
          </div>
          {meeting.rawTranscript && <CopyButton text={meeting.rawTranscript} />}
        </div>

        {meeting.transcriptStatus === 'completed' && meeting.rawTranscript ? (
          <pre className="max-h-[70vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800">
            {meeting.rawTranscript}
          </pre>
        ) : meeting.transcriptStatus === 'processing' ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Transcript is running. Refresh when the CLI finishes.
          </p>
        ) : meeting.transcriptStatus === 'failed' ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Transcription failed{meeting.transcriptError ? `: ${meeting.transcriptError}` : '.'}
          </p>
        ) : (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            No transcript yet. Run{' '}
            <code className="rounded bg-zinc-100 px-1">npm run stt:transcribe -- --clip {meeting.granicusClipId ?? meetingId}</code>
          </p>
        )}
      </section>
    </main>
  );
}
