'use server';

import type { Report } from 'src/types/report';
import type { Store, StockStatus } from 'src/types/store';

import { revalidatePath } from 'next/cache';

import { createClient } from 'src/lib/supabase/server';
import * as storesService from 'src/services/stores.service';
import * as reportsService from 'src/services/reports.service';

// ----------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath('/admin');
  return {};
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/admin');
}

async function getReviewerId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

  return user.id;
}

export async function approveReportAction(
  report: Report,
  mergeIntoStoreId?: string
): Promise<void> {
  const supabase = await createClient();
  const reviewerId = await getReviewerId();

  await reportsService.approveReport(supabase, report, reviewerId, mergeIntoStoreId);
  revalidatePath('/admin');
}

export async function rejectReportAction(reportId: string): Promise<void> {
  const supabase = await createClient();
  const reviewerId = await getReviewerId();

  await reportsService.rejectReport(supabase, reportId, reviewerId);
  revalidatePath('/admin');
}

export async function updateStoreAction(
  storeId: string,
  patch: Partial<
    Pick<
      Store,
      'name' | 'address' | 'province' | 'district' | 'subdistrict' | 'latitude' | 'longitude'
    >
  >
): Promise<void> {
  const supabase = await createClient();
  await storesService.adminUpdateStore(supabase, storeId, patch);
  revalidatePath('/admin');
}

export async function setStoreStatusAction(storeId: string, status: StockStatus): Promise<void> {
  const supabase = await createClient();
  await storesService.adminSetStoreStatus(supabase, storeId, status);
  revalidatePath('/admin');
}

export async function setStoreActiveAction(storeId: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  await storesService.adminSetStoreActive(supabase, storeId, isActive);
  revalidatePath('/admin');
}

export async function searchStoresAction(keyword: string): Promise<Store[]> {
  const supabase = await createClient();
  return storesService.searchStoresByName(supabase, keyword);
}
