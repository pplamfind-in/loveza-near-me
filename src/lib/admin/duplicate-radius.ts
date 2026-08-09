// Keep in sync with the admin_settings CHECK constraints in the latest
// Supabase migration.
export const MIN_DUPLICATE_RADIUS_M = 10;
export const MAX_DUPLICATE_RADIUS_M = 15_000;

export const DUPLICATE_RADIUS_OPTIONS_M = [
  10, 25, 50, 75, 100, 250, 500, 1_000, 2_000, 5_000, 10_000, 15_000,
] as const;

export const MIN_SEARCH_RADIUS_M = 500;
export const MAX_SEARCH_RADIUS_M = 50_000;

export const SEARCH_RADIUS_OPTIONS_M = [
  500, 1_000, 2_000, 3_000, 5_000, 10_000, 20_000, 30_000, 50_000,
] as const;

export function formatRadiusM(radiusM: number) {
  if (radiusM < 1_000) return `${radiusM.toLocaleString('th-TH')} เมตร`;

  return `${(radiusM / 1_000).toLocaleString('th-TH', { maximumFractionDigits: 2 })} กม.`;
}
