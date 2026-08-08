import type { Metadata } from 'next';

import { createClient } from 'src/lib/supabase/server';
import { getAdminNetworkStats } from 'src/lib/admin/get-network-stats';

import { AdminNetworkView } from 'src/sections/admin/admin-network-view';

export const metadata: Metadata = { title: 'จุดขายทั่วประเทศไทย | Loveza Admin' };

export default async function AdminNetworkPage() {
  const supabase = await createClient();
  const { stats, error } = await getAdminNetworkStats(supabase);

  return <AdminNetworkView initialStats={stats} hasError={Boolean(error)} />;
}
