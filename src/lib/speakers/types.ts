export type SpeakerEvidence =
  | 'chair_introduction'
  | 'meeting_roster'
  | 'repeated_turns'
  | 'roll_call'
  | 'self_identification'
  | 'fuzzy_surname'
  | 'admin_lock';

export type SpeakerMapping = {
  speakerId: number;
  resolvedName: string | null;
  officialName: string | null;
  confidence: number;
  evidence: SpeakerEvidence[];
  locked?: boolean;
};

export type SpeakerLock = {
  speakerId: number;
  officialName: string;
};

export type TranscriptTurn = {
  speakerId: number;
  text: string;
  offset: number;
  duration: number;
};

export type ResolveResult = {
  mappings: SpeakerMapping[];
  resolvedTranscript: string;
};

export const PUBLISH_NAME_MIN = 0.95;
export const CORROBORATE_MIN = 0.75;

export function shouldPublishName(mapping: SpeakerMapping): boolean {
  if (!mapping.resolvedName) return false;
  if (mapping.locked) return true;
  if (mapping.confidence > PUBLISH_NAME_MIN) return true;
  if (mapping.confidence >= CORROBORATE_MIN && mapping.evidence.length >= 2) return true;
  return false;
}
