import type { Metadata } from 'next';
import type { AdminOverviewStats } from 'src/sections/admin/admin-overview';

import Box from '@mui/material/Box';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';

import { AdminOverview } from 'src/sections/admin/admin-overview';
import { PendingReportsPanel } from 'src/sections/admin/pending-reports-panel';

export const metadata: Metadata = { title: 'Admin Dashboard | Loveza Near Me' };

export default async function AdminPage() {
  const supabase = await createClient();
  const [usersResult, storesResult, productsResult, pendingResult] = await Promise.all([
    supabase.rpc('admin_user_activity'),
    supabase.from('stores').select('estimated_quantity'),
    supabase.from('products').select('is_active'),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
  ]);

  const stores = storesResult.data ?? [];
  const products = productsResult.data ?? [];
  const stats: AdminOverviewStats = {
    users: usersResult.data?.length ?? 0,
    locations: stores.length,
    totalStock: stores.reduce(
      (total, store) => total + Number(store.estimated_quantity ?? 0),
      0
    ),
    products: products.length,
    activeProducts: products.filter((product) => product.is_active).length,
    pendingReports: pendingResult.count ?? 0,
  };
  const hasError = Boolean(
    usersResult.error || storesResult.error || productsResult.error || pendingResult.error
  );

  return (
    <DashboardContent maxWidth="xl">
      <AdminOverview stats={stats} hasError={hasError} />
      <Box sx={{ mt: { xs: 6, md: 8 } }}>
        <PendingReportsPanel />
      </Box>
    </DashboardContent>
  );
}
