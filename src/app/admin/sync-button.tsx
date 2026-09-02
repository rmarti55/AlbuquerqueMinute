'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/sync-legistar', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      setMessage(`Synced ${data.upserted} meetings (${data.withVideo} with video)`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? 'Syncing…' : 'Sync Legistar'}
      </button>
      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </div>
  );
}
