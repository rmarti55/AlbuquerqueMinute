export type PlanningBody = {
  slug: string;
  body: string;
  url: string;
  defaultTime: { hour: number; minute: number };
  location: string;
};

export const PLANNING_BODIES: PlanningBody[] = [
  {
    slug: 'epc',
    body: 'Environmental Planning Commission',
    url: 'https://www.cabq.gov/planning/boards-commissions/environmental-planning-commission/epc-agendas-reports-minutes',
    defaultTime: { hour: 8, minute: 40 },
    location: 'Via Zoom Video Conference',
  },
  {
    slug: 'zhe',
    body: 'Zoning Hearing Examiner',
    url: 'https://www.cabq.gov/planning/boards-commissions/zoning-hearing-examiner/zhe-agendas-action-sheets-decisions',
    defaultTime: { hour: 9, minute: 0 },
    location: 'Via Zoom Video Conference',
  },
  {
    slug: 'dho',
    body: 'Development Hearing Officer',
    url: 'https://www.cabq.gov/planning/boards-commissions/development-hearing-officer/development-hearing-officer-agendas-archives',
    defaultTime: { hour: 9, minute: 0 },
    location: 'Via Zoom Video Conference',
  },
  {
    slug: 'landmarks',
    body: 'Landmarks Commission',
    url: 'https://www.cabq.gov/planning/boards-commissions/landmarks-commission/landmarks-commission-agendas-action-sheets',
    defaultTime: { hour: 15, minute: 0 },
    location: 'Via Zoom Video Conference',
  },
];
