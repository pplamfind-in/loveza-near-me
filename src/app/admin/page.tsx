import type { Metadata } from 'next';
import type { AdminOverviewStats } from 'src/sections/admin/admin-overview';

import Box from '@mui/material/Box';

import { createClient } from 'src/lib/supabase/server';
import { DashboardContent } from 'src/layouts/dashboard';
import { sumEstimatedQuantity, getPendingReportsCount } from 'src/lib/admin/stats';

import { AdminOverview } from 'src/sections/admin/admin-overview';
import { PendingReportsPanel } from 'src/sections/admin/pending-reports-panel';

export const metadata: Metadata = { title: 'Admin Dashboard | Loveza Hunt' };

export default async function AdminPage() {
  const supabase = await createClient();
  const [usersResult, storesResult, productsResult, pendingReports] = await Promise.all([
    supabase.rpc('admin_user_activity'),
    supabase.from('stores').select('estimated_quantity'),
    supabase.from('products').select('is_active'),
    getPendingReportsCount(supabase),
  ]);

  const stores = storesResult.data ?? [];
  const products = productsResult.data ?? [];
  const stats: AdminOverviewStats = {
    users: usersResult.data?.length ?? 0,
    locations: stores.length,
    totalStock: sumEstimatedQuantity(stores),
    products: products.length,
    activeProducts: products.filter((product) => product.is_active).length,
    pendingReports: pendingReports.count,
  };
  const hasError = Boolean(
    usersResult.error || storesResult.error || productsResult.error || pendingReports.error
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
