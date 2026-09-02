export const LEGISTAR_CLIENT = 'cabq';

/** Council + committees on Legistar for v1. BodyId from /v1/cabq/bodies */
export const LEGISTAR_BODY_IDS = new Set([
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
]);

export const LOOKBACK_DAYS = 14;
export const LOOKAHEAD_DAYS = 60;

export const GRANICUS_VIEW_ID = 2;

export function granicusPlayerUrl(clipId: number): string {
  return `https://cabq.granicus.com/player/clip/${clipId}?view_id=${GRANICUS_VIEW_ID}&redirect=true`;
}
