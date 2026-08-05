import type { SupabaseClient } from '@supabase/supabase-js';
import type { Store, StockStatus } from 'src/types/store';
import type { Report, ApprovalStatus, NewReportInput } from 'src/types/report';

// ----------------------------------------------------------------------

const REPORT_IMAGES_BUCKET = 'report-images';

export async function uploadReportPhoto(
  supabase: SupabaseClient,
  file: File
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(REPORT_IMAGES_BUCKET).upload(fileName, file, {
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(REPORT_IMAGES_BUCKET).getPublicUrl(fileName);

  return data.publicUrl;
}

export async function createReport(
  supabase: SupabaseClient,
  input: NewReportInput
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({ ...input, approval_status: 'pending' })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function createQuickStatusReport(
  supabase: SupabaseClient,
  store: Store,
  stockStatus: StockStatus
): Promise<Report> {
  return createReport(supabase, {
    store_name: store.name,
    province: store.province,
    district: store.district,
    subdistrict: store.subdistrict,
    latitude: store.latitude,
    longitude: store.longitude,
    flavor: null,
    stock_status: stockStatus,
    photo_url: null,
    note: null,
  });
}

export type LatestReportFilters = {
  province?: string;
  district?: string;
  stockStatus?: StockStatus;
  flavor?: string;
};

export async function getLatestApprovedReports(
  supabase: SupabaseClient,
  filters?: LatestReportFilters
): Promise<Report[]> {
  let query = supabase.from('reports').select('*').eq('approval_status', 'approved');

  if (filters?.province) query = query.eq('province', filters.province);
  if (filters?.district) query = query.ilike('district', `%${filters.district}%`);
  if (filters?.stockStatus) query = query.eq('stock_status', filters.stockStatus);
  if (filters?.flavor) query = query.ilike('flavor', `%${filters.flavor}%`);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getLatestApprovedReportForStore(
  supabase: SupabaseClient,
  storeId: string
): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('store_id', storeId)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

// ---- Admin-only reads/writes (RLS enforces the actual permission) --------

export async function getReportsByStatus(
  supabase: SupabaseClient,
  status: ApprovalStatus
): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('approval_status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function adminUpdateReport(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      Report,
      'store_name' | 'address' | 'province' | 'district' | 'subdistrict' | 'latitude' | 'longitude'
    >
  >
): Promise<void> {
  const { error } = await supabase.from('reports').update(patch).eq('id', id);

  if (error) throw new Error(error.message);
}

export async function rejectReport(
  supabase: SupabaseClient,
  id: string,
  reviewerId: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      approval_status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Approves a report: either creates a brand-new store from the report's
 * location, or merges the report into an existing store (updating its
 * status/last_reported_at), then links the report to that store.
 */
export async function approveReport(
  supabase: SupabaseClient,
  report: Report,
  reviewerId: string,
  mergeIntoStoreId?: string
): Promise<void> {
  let storeId = mergeIntoStoreId;

  if (storeId) {
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        current_status: report.stock_status,
        last_reported_at: report.created_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (updateError) throw new Error(updateError.message);
  } else {
    const { data: newStore, error: insertError } = await supabase
      .from('stores')
      .insert({
        name: report.store_name,
        address: report.address,
        province: report.province,
        district: report.district,
        subdistrict: report.subdistrict,
        latitude: report.latitude,
        longitude: report.longitude,
        current_status: report.stock_status,
        last_reported_at: report.created_at,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    storeId = newStore.id;
  }

  const { error: reportError } = await supabase
    .from('reports')
    .update({
      store_id: storeId,
      approval_status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', report.id);

  if (reportError) throw new Error(reportError.message);
}
