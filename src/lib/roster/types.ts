export type RosterPerson = {
  name: string;
  role: string;
  district?: string;
  meetingRole?: string;
  aliases?: string[];
  activeFrom?: string;
  activeTo?: string;
};

export type MeetingRoster = {
  officials: RosterPerson[];
  staff: RosterPerson[];
  source: 'curated' | 'legistar_office_records+curated';
};

export function allRosterPeople(roster: MeetingRoster): RosterPerson[] {
  return [...roster.officials, ...roster.staff];
}
