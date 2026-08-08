import type { createClient } from 'src/lib/supabase/server';
import type { AdminNetworkStats } from 'src/types/admin-network';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type NetworkStatsRow = {
  locations: number | string;
  verified_locations: number | string;
  pending_locations: number | string;
  provinces: number | string;
  total_stock: number | string;
  duplicate_radius_m: number | string;
};

const EMPTY_STATS: AdminNetworkStats = {
  locations: 0,
  verifiedLocations: 0,
  pendingLocations: 0,
  provinces: 0,
  totalStock: 0,
  duplicateRadiusM: 75,
};

export async function getAdminNetworkStats(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.rpc('admin_network_stats');
  const row = (data as NetworkStatsRow[] | null)?.[0];

  if (error || !row) return { stats: EMPTY_STATS, error: error ?? new Error('No stats returned') };

  return {
    stats: {
      locations: Number(row.locations),
      verifiedLocations: Number(row.verified_locations),
      pendingLocations: Number(row.pending_locations),
      provinces: Number(row.provinces),
      totalStock: Number(row.total_stock),
      duplicateRadiusM: Number(row.duplicate_radius_m),
    },
    error: null,
  };
}
