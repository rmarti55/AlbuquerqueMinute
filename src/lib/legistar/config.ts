export const LOOKBACK_DAYS = 31;
export const LOOKAHEAD_DAYS = 60;

export type LegistarTenant = {
  client: string;
  source: string;
  bodyIds: Set<number>;
  granicusHost: string;
  granicusViewId: number;
};

/** Council + committees + Development Commission on cabq Legistar. */
export const CABQ_TENANT: LegistarTenant = {
  client: 'cabq',
  source: 'legistar',
  bodyIds: new Set([
    1, // City Council
    6, // Land Use, Planning, and Zoning Committee
    7, // Committee of the Whole
    9, // Finance & Government Operations Committee
    13, // Local Government Coordinating Commission
    23, // President
    26, // Intergovernmental Legislative Relations Committee
    29, // Internal Operations Committee
    44, // Special City Council
    46, // City Council Study Session
    48, // Public Safety Committee
    50, // Albuquerque Development Commission
  ]),
  granicusHost: 'cabq.granicus.com',
  granicusViewId: 2,
};

export const ABCWUA_TENANT: LegistarTenant = {
  client: 'abcwua',
  source: 'legistar_abcwua',
  bodyIds: new Set([
    39, // Albuquerque Bernalillo County Water Utility Authority
    49, // Labor Management Relations Board
    50, // Technical Customer Advisory Committee
    51, // Water Protection Advisory Board
  ]),
  granicusHost: 'abcwua.granicus.com',
  granicusViewId: 1,
};

/** @deprecated use CABQ_TENANT.client */
export const LEGISTAR_CLIENT = CABQ_TENANT.client;
/** @deprecated use CABQ_TENANT.bodyIds */
export const LEGISTAR_BODY_IDS = CABQ_TENANT.bodyIds;
export const GRANICUS_VIEW_ID = CABQ_TENANT.granicusViewId;

export function granicusPlayerUrl(
  clipId: number,
  tenant: Pick<LegistarTenant, 'granicusHost' | 'granicusViewId'> = CABQ_TENANT,
): string {
  return `https://${tenant.granicusHost}/player/clip/${clipId}?view_id=${tenant.granicusViewId}&redirect=true`;
}
