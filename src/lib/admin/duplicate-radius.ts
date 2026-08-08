// Keep in sync with the admin_settings.duplicate_radius_m CHECK constraint
// in the latest Supabase migration.
export const MIN_RADIUS_M = 10;
export const MAX_RADIUS_M = 15_000;

export const RADIUS_OPTIONS_M = [
  10, 25, 50, 75, 100, 250, 500, 1_000, 2_000, 5_000, 10_000, 15_000,
] as const;

export function formatDuplicateRadius(radiusM: number) {
  if (radiusM < 1_000) return `${radiusM.toLocaleString('th-TH')} เมตร`;

  return `${(radiusM / 1_000).toLocaleString('th-TH', { maximumFractionDigits: 2 })} กม.`;
}
