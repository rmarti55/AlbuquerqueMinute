import type { RosterPerson } from './types';

export function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function lastName(fullName: string): string {
  const parts = normalizeToken(fullName).split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  const prev = Array.from({ length: lb + 1 }, (_, j) => j);
  const curr = new Array<number>(lb + 1);
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= lb; j++) prev[j] = curr[j];
  }
  return prev[lb];
}

function personSurnames(person: RosterPerson): string[] {
  const names = [person.name, ...(person.aliases ?? [])];
  return [...new Set(names.map(lastName).filter((s) => s.length >= 3))];
}

function phoneticSurname(value: string): string {
  return value
    .replace(/aught/g, 'out')
    .replace(/ough/g, 'o')
    .replace(/gh/g, '')
    .replace(/gne$/g, 'ne')
    .replace(/[aeiou]+/g, (m) => m[0] ?? '');
}

function fuzzySurnameMatch(spoken: string, rosterSurname: string): boolean {
  if (spoken === rosterSurname) return true;
  if (spoken.length < 4 || rosterSurname.length < 4) return false;
  if (spoken.length >= 5 && rosterSurname.length >= 5) {
    if (spoken.includes(rosterSurname) || rosterSurname.includes(spoken)) return true;
  }
  const dist = levenshtein(spoken, rosterSurname);
  const maxLen = Math.max(spoken.length, rosterSurname.length);
  if (maxLen >= 7 && dist <= Math.max(2, Math.floor(maxLen * 0.35))) return true;
  if (maxLen >= 5 && dist <= 2) return true;
  if (maxLen < 5 && dist <= 1) return true;
  const spokenPh = phoneticSurname(spoken);
  const rosterPh = phoneticSurname(rosterSurname);
  if (spokenPh.length >= 3 && spokenPh === rosterPh) return true;
  if (spokenPh.length >= 4 && rosterPh.length >= 4) {
    const phDist = levenshtein(spokenPh, rosterPh);
    const phMax = Math.max(spokenPh.length, rosterPh.length);
    return phDist <= Math.max(1, Math.floor(phMax * 0.25));
  }
  return false;
}

/** Closed-set surname match. Null when missing or ambiguous. */
export function matchRosterPerson(
  spokenSurname: string,
  people: RosterPerson[],
): RosterPerson | null {
  const spoken = lastName(spokenSurname);
  if (spoken.length < 3) return null;

  const exact = people.filter((person) => personSurnames(person).includes(spoken));
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  if (spoken.length < 4) return null;

  const fuzzy = people.filter((person) =>
    personSurnames(person).some((surname) => fuzzySurnameMatch(spoken, surname)),
  );
  if (fuzzy.length === 1) return fuzzy[0];
  return null;
}

export function displayLastName(person: RosterPerson): string {
  const parts = person.name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? person.name;
}

export function displaySpeakerLabel(person: RosterPerson): string {
  const surname = displayLastName(person);
  if (person.meetingRole === 'Vice President') return `Vice President ${surname}`;
  if (person.meetingRole === 'President') return `President ${surname}`;
  if (person.role === 'Mayor') return `Mayor ${surname}`;
  if (person.role === 'Councilor') return `Councilor ${surname}`;
  if (person.role) return `${person.role} ${surname}`;
  return person.name;
}

export function deepgramKeywords(people: RosterPerson[]): string[] {
  const terms = new Set<string>();
  for (const person of people) {
    terms.add(displayLastName(person));
    terms.add(person.name);
    for (const alias of person.aliases ?? []) terms.add(alias);
  }
  return [...terms].filter((term) => term.trim().length >= 3);
}
