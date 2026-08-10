import type { createClient } from 'src/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getReportsSummary(supabase: SupabaseServerClient) {
  const countReports = (status?: 'pending' | 'approved' | 'rejected') => {
    let query = supabase.from('reports').select('id', { count: 'exact', head: true });

    if (status) {
      query = query.eq('approval_status', status);
    }

    return query;
  };

  const [total, approved, pending, rejected] = await Promise.all([
    countReports(),
    countReports('approved'),
    countReports('pending'),
    countReports('rejected'),
  ]);

  return {
    data: {
      totalReports: total.count ?? 0,
      approvedReports: approved.count ?? 0,
      pendingReports: pending.count ?? 0,
      rejectedReports: rejected.count ?? 0,
    },
    error: total.error || approved.error || pending.error || rejected.error,
  };
}

export function sumEstimatedQuantity(stores: { estimated_quantity: number | string | null }[]) {
  return stores.reduce((total, store) => total + Number(store.estimated_quantity ?? 0), 0);
}
