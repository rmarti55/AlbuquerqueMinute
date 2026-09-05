export type BoardPage = {
  slug: string;
  body: string;
  url: string;
  defaultTime: { hour: number; minute: number };
};

/** Decision / oversight boards first. Advisory boards can be added later. */
export const BOARD_PAGES: BoardPage[] = [
  {
    slug: 'ethics',
    body: 'Board of Ethics',
    url: 'https://www.cabq.gov/clerk/ethics',
    defaultTime: { hour: 17, minute: 0 },
  },
  {
    slug: 'personnel',
    body: 'Personnel Board',
    url: 'https://www.cabq.gov/clerk/administrative-hearings/personnel-board-personnel-hearings',
    defaultTime: { hour: 9, minute: 0 },
  },
  {
    slug: 'ago',
    body: 'Accountability in Government Oversight Committee',
    url: 'https://www.cabq.gov/audit/internal-audit/accountability-government-oversight-committee',
    defaultTime: { hour: 9, minute: 0 },
  },
  {
    slug: 'air-quality',
    body: 'Albuquerque-Bernalillo County Air Quality Control Board',
    url: 'https://www.cabq.gov/airquality/air-quality-control-board',
    defaultTime: { hour: 17, minute: 30 },
  },
  {
    slug: 'human-rights',
    body: 'Human Rights Board',
    url: 'https://www.cabq.gov/office-of-equity-inclusion/about-office-of-equity-inclusion/civilrights/human-rights-board',
    defaultTime: { hour: 17, minute: 0 },
  },
  {
    slug: 'open-space',
    body: 'Open Space Advisory Board',
    url: 'https://www.cabq.gov/parksandrecreation/our-department/boards-commissions/open-space-advisory-board',
    defaultTime: { hour: 17, minute: 0 },
  },
  {
    slug: 'arts',
    body: 'Arts Board',
    url: 'https://www.cabq.gov/artsculture/public-art/staff-and-board/arts-board',
    defaultTime: { hour: 17, minute: 0 },
  },
  {
    slug: 'transit',
    body: 'Transit Advisory Board',
    url: 'https://www.cabq.gov/transit/opportunities/serve-on-a-board/transit-advisory-board',
    defaultTime: { hour: 16, minute: 0 },
  },
];

export const ONBASE_PUBLIC =
  'https://onbase.cabq.gov/publicaccess/?CQID=136';
