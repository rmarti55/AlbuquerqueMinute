'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SpeakerMapping } from '@/lib/speakers/types';
import { shouldPublishName } from '@/lib/speakers/types';

export function SpeakerMap({
  meetingId,
  mappings,
  rosterNames,
}: {
  meetingId: number;
  mappings: SpeakerMapping[];
  rosterNames: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(speakerId: number, officialName: string | null) {
    setPending(speakerId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakerId, officialName }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Save failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setPending(null);
    }
  }

  if (mappings.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-zinc-900">Speaker map</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Names above 0.95 publish on the resolved transcript. Lock a roster name to force it.
      </p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Resolved</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Evidence</th>
              <th className="px-3 py-2 font-medium">Lock</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => (
              <tr key={mapping.speakerId} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-mono text-zinc-700">{mapping.speakerId}</td>
                <td className="px-3 py-2 text-zinc-800">
                  {shouldPublishName(mapping) ? mapping.resolvedName : `Speaker ${mapping.speakerId}`}
                  {mapping.officialName && !shouldPublishName(mapping) ? (
                    <span className="ml-1 text-zinc-400">({mapping.officialName})</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-zinc-600">{mapping.confidence.toFixed(2)}</td>
                <td className="px-3 py-2 text-zinc-500">{mapping.evidence.join(', ') || '—'}</td>
                <td className="px-3 py-2">
                  <select
                    className="max-w-48 rounded border border-zinc-300 bg-white px-1.5 py-1 text-zinc-800"
                    disabled={pending === mapping.speakerId}
                    value={mapping.locked ? (mapping.officialName ?? '') : ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      void save(mapping.speakerId, value || null);
                    }}
                  >
                    <option value="">Auto</option>
                    {rosterNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
