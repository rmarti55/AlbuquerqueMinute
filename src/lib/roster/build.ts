import councilData from './council.json';
import type { MeetingRoster, RosterPerson } from './types';
import { lastName } from './names';

type CuratedFile = {
  officials: RosterPerson[];
  staff: RosterPerson[];
};

const CURATED = councilData as CuratedFile;

export type LegistarOfficeRecord = {
  OfficeRecordFullName?: string;
  OfficeRecordLastName?: string;
  OfficeRecordTitle?: string | null;
  OfficeRecordMemberType?: string | null;
  OfficeRecordStartDate?: string;
  OfficeRecordEndDate?: string;
  OfficeRecordBodyId?: number;
};

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPersonActive(person: RosterPerson, at: Date): boolean {
  const from = parseDate(person.activeFrom);
  const to = parseDate(person.activeTo);
  if (from && at < from) return false;
  if (to && at > to) return false;
  return true;
}

function overlayMeetingRole(person: RosterPerson, records: LegistarOfficeRecord[], at: Date): RosterPerson {
  const surname = lastName(person.name);
  const active = records.filter((record) => {
    if (record.OfficeRecordBodyId != null && record.OfficeRecordBodyId !== 1) return false;
    const recordSurname = lastName(record.OfficeRecordLastName || record.OfficeRecordFullName || '');
    if (recordSurname !== surname) return false;
    const start = parseDate(record.OfficeRecordStartDate);
    const end = parseDate(record.OfficeRecordEndDate);
    if (start && at < start) return false;
    if (end && at > end) return false;
    return true;
  });

  const titles = active
    .map((record) => (record.OfficeRecordTitle ?? '').trim())
    .filter(Boolean);
  const meetingRole = titles.find((title) => /vice[-\s]?president/i.test(title))
    ? 'Vice President'
    : titles.find((title) => /^president$/i.test(title))
      ? 'President'
      : person.meetingRole;

  return meetingRole === person.meetingRole ? person : { ...person, meetingRole };
}

export function buildMeetingRoster(
  meetingAt: Date,
  officeRecords?: LegistarOfficeRecord[],
): MeetingRoster {
  const officials = CURATED.officials
    .filter((person) => isPersonActive(person, meetingAt))
    .map((person) =>
      officeRecords?.length ? overlayMeetingRole(person, officeRecords, meetingAt) : person,
    );

  return {
    officials,
    staff: CURATED.staff,
    source: officeRecords?.length ? 'legistar_office_records+curated' : 'curated',
  };
}

export function parseRosterJson(raw: string | null | undefined): MeetingRoster | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as MeetingRoster;
    if (!Array.isArray(parsed.officials)) return null;
    return {
      officials: parsed.officials,
      staff: Array.isArray(parsed.staff) ? parsed.staff : [],
      source: parsed.source === 'legistar_office_records+curated'
        ? 'legistar_office_records+curated'
        : 'curated',
    };
  } catch {
    return null;
  }
}

export function serializeRoster(roster: MeetingRoster): string {
  return JSON.stringify(roster);
}
