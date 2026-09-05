import { describe, expect, it } from 'vitest';
import { buildMeetingRoster } from '@/lib/roster/build';
import { matchRosterPerson } from '@/lib/roster/names';
import { allRosterPeople } from '@/lib/roster/types';
import { getArticleTranscript } from '@/lib/speakers/article-source';
import { rewriteSpokenNames, resolveSpeakers } from '@/lib/speakers/resolve';
import { shouldPublishName, type TranscriptTurn } from '@/lib/speakers/types';

const roster = buildMeetingRoster(new Date('2026-08-17T17:00:00-06:00'));
const people = allRosterPeople(roster);

function turn(speakerId: number, text: string, offset = 0, duration = 2000): TranscriptTurn {
  return { speakerId, text, offset, duration };
}

describe('matchRosterPerson', () => {
  it('maps Draught to Grout', () => {
    expect(matchRosterPerson('Draught', people)?.name).toBe('Renée Grout');
  });

  it('maps Champagne to Champine', () => {
    expect(matchRosterPerson('Champagne', people)?.name).toBe('Dan Champine');
  });

  it('refuses a surname that hits nobody uniquely', () => {
    expect(matchRosterPerson('Smith', people)).toBeNull();
  });
});

describe('rewriteSpokenNames', () => {
  it('rewrites honorific + ASR surname in resolved copy only', () => {
    const rewritten = rewriteSpokenNames(
      'Councilor Draught, you have the floor. Vice President Champagne.',
      people,
    );
    expect(rewritten).toContain('Councilor Grout');
    expect(rewritten).toContain('Vice President Champine');
    expect(rewritten).not.toContain('Draught');
    expect(rewritten).not.toContain('Champagne');
  });

  it('leaves non-roster names alone', () => {
    expect(rewriteSpokenNames('Director Stoker is here.', people)).toBe('Director Stoker is here.');
  });
});

describe('resolveSpeakers', () => {
  it('maps the next speaker after a chair introduction', () => {
    const result = resolveSpeakers(
      [
        turn(0, 'Councilor Draught.', 0, 1500),
        turn(10, 'Thank you, Madam President. I have a question for HR.', 1600, 8000),
        turn(10, 'Director Stoker, can you walk us through this?', 10000, 4000),
        turn(10, 'I will wait for that answer.', 15000, 3000),
      ],
      roster,
    );

    const mapped = result.mappings.find((m) => m.speakerId === 10);
    expect(mapped?.officialName).toBe('Renée Grout');
    expect(mapped?.resolvedName).toBe('Councilor Grout');
    expect(mapped?.evidence).toContain('chair_introduction');
    expect(shouldPublishName(mapped!)).toBe(true);
    expect(result.resolvedTranscript).toContain('Councilor Grout:');
    expect(result.resolvedTranscript).toContain('Speaker 0:');
    expect(result.resolvedTranscript).not.toMatch(/\] Councilor Draught:/);
  });

  it('rewrites Draught in dialogue on the resolved transcript', () => {
    const result = resolveSpeakers(
      [
        turn(0, 'Councilor Draught.', 0, 1500),
        turn(10, 'Thank you.', 1600, 2000),
        turn(0, 'Thank you, Councilor Draught.', 4000, 2000),
      ],
      roster,
    );
    expect(result.resolvedTranscript).toContain('Councilor Grout.');
    expect(result.resolvedTranscript).not.toContain('Draught');
  });

  it('does not treat councilors/present as a name cue', () => {
    const result = resolveSpeakers(
      [
        turn(0, 'All councilors are present this evening.', 0, 2000),
        turn(1, 'I pledge allegiance to the flag.', 2100, 4000),
      ],
      roster,
    );
    expect(result.mappings.find((m) => m.speakerId === 1)?.officialName).toBeNull();
  });

  it('keeps Speaker N when confidence is too low to publish', () => {
    const result = resolveSpeakers([turn(3, 'I think we should vote.', 0, 4000)], roster);
    const mapped = result.mappings.find((m) => m.speakerId === 3);
    expect(mapped?.officialName).toBeNull();
    expect(result.resolvedTranscript).toContain('Speaker 3:');
  });

  it('honors an admin lock at confidence 1', () => {
    const result = resolveSpeakers(
      [turn(4, 'Good evening.', 0, 2000)],
      roster,
      [{ speakerId: 4, officialName: 'Dan Champine' }],
    );
    const mapped = result.mappings.find((m) => m.speakerId === 4);
    expect(mapped?.resolvedName).toBe('Vice President Champine');
    expect(mapped?.confidence).toBe(1);
    expect(mapped?.locked).toBe(true);
    expect(result.resolvedTranscript).toContain('Vice President Champine:');
  });
});

describe('getArticleTranscript', () => {
  it('requires the resolved transcript', () => {
    expect(() => getArticleTranscript({ rawTranscript: 'Speaker 0: hi' })).toThrow(/Resolved transcript/);
    expect(getArticleTranscript({ resolvedTranscript: 'Councilor Grout: hi' })).toBe('Councilor Grout: hi');
  });
});
