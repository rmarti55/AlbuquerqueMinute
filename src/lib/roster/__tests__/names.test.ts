import { describe, expect, it } from 'vitest';
import { buildMeetingRoster } from '../build';
import { matchRosterPerson } from '../names';
import { allRosterPeople } from '../types';

const people = allRosterPeople(buildMeetingRoster(new Date('2026-08-17')));

describe('roster fuzzy match', () => {
  it('Grout / Draught', () => {
    expect(matchRosterPerson('Grout', people)?.name).toBe('Renée Grout');
    expect(matchRosterPerson('Draught', people)?.name).toBe('Renée Grout');
  });

  it('Champine / Champagne', () => {
    expect(matchRosterPerson('Champine', people)?.name).toBe('Dan Champine');
    expect(matchRosterPerson('Champagne', people)?.name).toBe('Dan Champine');
  });

  it('does not invent a name outside the roster', () => {
    expect(matchRosterPerson('Henderson', people)).toBeNull();
  });
});
