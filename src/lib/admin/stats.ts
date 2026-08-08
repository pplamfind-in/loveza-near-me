import type { createClient } from 'src/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getPendingReportsCount(supabase: SupabaseServerClient) {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending');

  return { count: count ?? 0, error };
}

export function sumEstimatedQuantity(stores: { estimated_quantity: number | string | null }[]) {
  return stores.reduce((total, store) => total + Number(store.estimated_quantity ?? 0), 0);
}
