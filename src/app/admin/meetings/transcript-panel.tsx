'use client';

import { useState } from 'react';
import { CopyButton } from './copy-button';

export function TranscriptPanel({
  rawTranscript,
  resolvedTranscript,
}: {
  rawTranscript: string;
  resolvedTranscript: string | null;
}) {
  const [view, setView] = useState<'resolved' | 'raw'>(
    resolvedTranscript ? 'resolved' : 'raw',
  );
  const text = view === 'resolved' && resolvedTranscript ? resolvedTranscript : rawTranscript;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('resolved')}
            disabled={!resolvedTranscript}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              view === 'resolved'
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Resolved
          </button>
          <button
            type="button"
            onClick={() => setView('raw')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              view === 'raw'
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Raw
          </button>
        </div>
        <CopyButton text={text} />
      </div>
      <pre className="max-h-[70vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800">
        {text}
      </pre>
    </div>
  );
}
