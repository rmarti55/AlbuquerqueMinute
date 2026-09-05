import { granicusPlayerUrl, type LegistarTenant } from './config';

export interface LegistarEvent {
  EventId: number;
  EventBodyId: number;
  EventBodyName: string;
  EventComment: string | null;
  EventDate: string;
  EventTime: string | null;
  EventInSiteURL: string | null;
  EventAgendaFile: string | null;
  EventMinutesFile: string | null;
  EventLocation: string | null;
  EventMedia: number | string | null;
  EventAgendaStatusName: string | null;
  EventMinutesStatusName: string | null;
}

export async function fetchLegistarEvents(
  tenant: LegistarTenant,
  filter?: string,
): Promise<LegistarEvent[]> {
  const params = new URLSearchParams({
    $orderby: 'EventDate desc',
    $top: '500',
  });
  if (filter) params.set('$filter', filter);

  const url = `https://webapi.legistar.com/v1/${tenant.client}/events?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Legistar ${tenant.client} events failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as LegistarEvent[];
  return data.filter((e) => tenant.bodyIds.has(e.EventBodyId));
}

export function isCanceled(event: LegistarEvent): boolean {
  const agenda = event.EventAgendaStatusName?.toLowerCase() ?? '';
  const minutes = event.EventMinutesStatusName?.toLowerCase() ?? '';
  return agenda.includes('cancel') || minutes.includes('cancel');
}

export function eventTitle(event: LegistarEvent): string {
  const comment = event.EventComment?.trim();
  if (comment) return comment;
  return event.EventBodyName;
}

export function parseEventMedia(event: LegistarEvent): number | null {
  const raw = event.EventMedia;
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function videoFromEvent(event: LegistarEvent, tenant: LegistarTenant) {
  const clipId = parseEventMedia(event);
  if (!clipId) return null;
  return {
    granicusClipId: clipId,
    playerUrl: granicusPlayerUrl(clipId, tenant),
    matchMethod: 'legistar_event_media',
  };
}

export function filesFromEvent(
  event: LegistarEvent,
): Array<{ type: string; url: string; name: string }> {
  const files: Array<{ type: string; url: string; name: string }> = [];
  if (event.EventAgendaFile) {
    files.push({ type: 'agenda', url: event.EventAgendaFile, name: 'Agenda' });
  }
  if (event.EventMinutesFile) {
    files.push({ type: 'minutes', url: event.EventMinutesFile, name: 'Minutes' });
  }
  return files;
}
