import type { SupabaseClient } from '@supabase/supabase-js';
import type { Store, StockStatus } from 'src/types/store';

// ----------------------------------------------------------------------

export async function getActiveStores(
  supabase: SupabaseClient,
  filters?: { province?: string }
): Promise<Store[]> {
  let query = supabase.from('stores').select('*').eq('is_active', true);

  if (filters?.province) {
    query = query.eq('province', filters.province);
  }

  const { data, error } = await query.order('last_reported_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getLatestStores(
  supabase: SupabaseClient,
  limit = 3
): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('last_reported_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getStoreById(
  supabase: SupabaseClient,
  id: string
): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function searchStoresByName(
  supabase: SupabaseClient,
  keyword: string
): Promise<Store[]> {
  if (!keyword.trim()) return [];

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .ilike('name', `%${keyword.trim()}%`)
    .order('name')
    .limit(10);

  if (error) throw new Error(error.message);

  return data ?? [];
}

// ---- Admin-only writes (RLS enforces the actual permission) --------------

export async function adminUpdateStore(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      Store,
      'name' | 'address' | 'province' | 'district' | 'subdistrict' | 'latitude' | 'longitude'
    >
  >
): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function adminSetStoreStatus(
  supabase: SupabaseClient,
  id: string,
  status: StockStatus
): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({
      current_status: status,
      last_reported_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function adminSetStoreActive(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
