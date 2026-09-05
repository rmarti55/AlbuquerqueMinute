import { formatTimestamp, type TranscriptSegment } from '@/lib/granicus/stt';
import { allRosterPeople, type MeetingRoster, type RosterPerson } from '@/lib/roster/types';
import {
  displayLastName,
  displaySpeakerLabel,
  matchRosterPerson,
} from '@/lib/roster/names';
import {
  shouldPublishName,
  type ResolveResult,
  type SpeakerEvidence,
  type SpeakerLock,
  type SpeakerMapping,
  type TranscriptTurn,
} from './types';

const RECOGNITION_RE =
  /\b(?:vice\s+president|president|councilor|counselor|director|mayor|mister|madam|ms\.|mr\.)\s+([A-Za-z][A-Za-z''-]{2,})\b/gi;

const SELF_ID_RE =
  /\b(?:i am|this is|i'm)\s+(?:vice\s+president|president|councilor|counselor|director|mayor)?\s*([A-Za-z][A-Za-z''-]{2,})/i;

const ROLL_CALL_RESPONSE_RE = /^(here|present|yes\.?|thank you\.?)$/i;
const CHAIR_GAP_MS = 20_000;

const HONORIFIC_REWRITE_RE =
  /((?:Vice\s+President|President|Councilor|Counselor|Director|Mayor|Mister|Madam|Ms\.|Mr\.)\s+)([A-Za-z][A-Za-z''-]{2,})/gi;

function uniqueEvidence(evidence: SpeakerEvidence[]): SpeakerEvidence[] {
  return [...new Set(evidence)];
}

function signalConfidence(evidence: SpeakerEvidence[]): number {
  const tags = new Set(evidence);
  if (tags.has('admin_lock')) return 1;
  if (tags.has('chair_introduction') && tags.has('roll_call')) return 0.99;
  if (tags.has('chair_introduction') && tags.has('repeated_turns')) return 0.99;
  if (tags.has('chair_introduction')) return 0.97;
  if (tags.has('roll_call')) return 0.96;
  if (tags.has('self_identification')) return 0.94;
  if (tags.has('fuzzy_surname') && tags.size >= 2) return 0.9;
  if (tags.has('fuzzy_surname')) return 0.7;
  if (tags.has('meeting_roster')) return 0.8;
  return 0.4;
}

function assign(
  byId: Map<number, SpeakerMapping>,
  speakerId: number,
  person: RosterPerson,
  evidence: SpeakerEvidence[],
): void {
  const officialName = person.name;
  const existing = byId.get(speakerId);
  if (existing?.locked) return;

  if (existing?.officialName && existing.officialName !== officialName) {
    const nextEvidence = uniqueEvidence([...existing.evidence, ...evidence]);
    const nextConfidence = signalConfidence(nextEvidence);
    if (nextConfidence <= existing.confidence + 0.05) {
      byId.set(speakerId, {
        speakerId,
        resolvedName: null,
        officialName: null,
        confidence: Math.min(existing.confidence, 0.6),
        evidence: uniqueEvidence([...existing.evidence, 'meeting_roster']),
      });
      return;
    }
  }

  const merged = uniqueEvidence([...(existing?.evidence ?? []), ...evidence, 'meeting_roster']);
  byId.set(speakerId, {
    speakerId,
    resolvedName: displaySpeakerLabel(person),
    officialName,
    confidence: signalConfidence(merged),
    evidence: merged,
    locked: existing?.locked,
  });
}

function extractRecognizedPeople(text: string, people: RosterPerson[]): RosterPerson[] {
  const found: RosterPerson[] = [];
  RECOGNITION_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RECOGNITION_RE.exec(text)) !== null) {
    if (!/^\p{Lu}/u.test(match[1])) continue;
    const person = matchRosterPerson(match[1], people);
    if (person && !found.some((p) => p.name === person.name)) found.push(person);
  }
  return found;
}

function isFuzzySpoken(spoken: string, person: RosterPerson): boolean {
  const spokenNorm = spoken.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const official = displayLastName(person).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return spokenNorm !== official;
}

export function parseSegmentsJson(raw: string | null | undefined): TranscriptTurn[] {
  if (!raw?.trim()) return [];
  try {
    const segments = JSON.parse(raw) as TranscriptSegment[];
    if (!Array.isArray(segments)) return [];
    return segments
      .filter((seg) => typeof seg.speakerId === 'number' && seg.text?.trim())
      .map((seg) => ({
        speakerId: seg.speakerId as number,
        text: seg.text.trim(),
        offset: seg.offset,
        duration: seg.duration,
      }));
  } catch {
    return [];
  }
}

export function parseSpeakerMapJson(raw: string | null | undefined): SpeakerMapping[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as SpeakerMapping[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rewriteSpokenNames(text: string, people: RosterPerson[]): string {
  return text.replace(HONORIFIC_REWRITE_RE, (full, honorific: string, surname: string) => {
    const person = matchRosterPerson(surname, people);
    if (!person) return full;
    const fixedHonorific = honorific.replace(/counselor/i, (m) =>
      m[0] === 'C' ? 'Councilor' : 'councilor',
    );
    return `${fixedHonorific}${displayLastName(person)}`;
  });
}

export function formatResolvedTranscript(
  turns: TranscriptTurn[],
  mappings: SpeakerMapping[],
  people: RosterPerson[],
): string {
  const byId = new Map(mappings.map((m) => [m.speakerId, m]));
  return turns
    .map((turn) => {
      const mapping = byId.get(turn.speakerId);
      const label =
        mapping && shouldPublishName(mapping) && mapping.resolvedName
          ? mapping.resolvedName
          : `Speaker ${turn.speakerId}`;
      const text = rewriteSpokenNames(turn.text, people);
      return `[${formatTimestamp(turn.offset / 1000)}] ${label}: ${text}`;
    })
    .join('\n');
}

export function resolveSpeakers(
  turns: TranscriptTurn[],
  roster: MeetingRoster,
  locks: SpeakerLock[] = [],
): ResolveResult {
  const people = allRosterPeople(roster);
  const byId = new Map<number, SpeakerMapping>();

  for (const turn of turns) {
    if (!byId.has(turn.speakerId)) {
      byId.set(turn.speakerId, {
        speakerId: turn.speakerId,
        resolvedName: null,
        officialName: null,
        confidence: 0,
        evidence: [],
      });
    }
  }

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const next = turns[i + 1];
    const recognized = extractRecognizedPeople(turn.text, people);

    if (next && recognized.length === 1 && next.speakerId !== turn.speakerId) {
      const gap = next.offset - (turn.offset + turn.duration);
      if (gap <= CHAIR_GAP_MS) {
        const person = recognized[0];
        const spokenMatch = turn.text.match(
          /\b(?:vice\s+president|president|councilor|counselor|director|mayor)\s+([A-Za-z][A-Za-z''-]{2,})\b/i,
        );
        const evidence: SpeakerEvidence[] = ['chair_introduction'];
        if (spokenMatch && isFuzzySpoken(spokenMatch[1], person)) evidence.push('fuzzy_surname');
        if (ROLL_CALL_RESPONSE_RE.test(next.text.trim())) evidence.push('roll_call');
        assign(byId, next.speakerId, person, evidence);
      }
    }

    const self = turn.text.match(SELF_ID_RE);
    if (self) {
      const person = matchRosterPerson(self[1], people);
      if (person) {
        const evidence: SpeakerEvidence[] = ['self_identification'];
        if (isFuzzySpoken(self[1], person)) evidence.push('fuzzy_surname');
        assign(byId, turn.speakerId, person, evidence);
      }
    }
  }

  const counts = new Map<number, number>();
  for (const turn of turns) {
    counts.set(turn.speakerId, (counts.get(turn.speakerId) ?? 0) + 1);
  }
  for (const mapping of byId.values()) {
    if (mapping.officialName && (counts.get(mapping.speakerId) ?? 0) >= 3) {
      mapping.evidence = uniqueEvidence([...mapping.evidence, 'repeated_turns']);
      mapping.confidence = signalConfidence(mapping.evidence);
    }
  }

  for (const lock of locks) {
    const person = people.find((p) => p.name === lock.officialName);
    if (!person) continue;
    byId.set(lock.speakerId, {
      speakerId: lock.speakerId,
      resolvedName: displaySpeakerLabel(person),
      officialName: person.name,
      confidence: 1,
      evidence: uniqueEvidence([...(byId.get(lock.speakerId)?.evidence ?? []), 'admin_lock']),
      locked: true,
    });
  }

  const mappings = [...byId.values()].sort((a, b) => a.speakerId - b.speakerId);

  return {
    mappings,
    resolvedTranscript: formatResolvedTranscript(turns, mappings, people),
  };
}

export function locksFromMappings(mappings: SpeakerMapping[]): SpeakerLock[] {
  return mappings
    .filter((m) => m.locked && m.officialName)
    .map((m) => ({ speakerId: m.speakerId, officialName: m.officialName as string }));
}
