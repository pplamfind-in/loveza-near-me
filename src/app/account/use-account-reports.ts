'use client';

import type { ExplorerProgress } from 'src/lib/explorer/progress';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ----------------------------------------------------------------------

export type UserReport = {
  id: string;
  store_id: string | null;
  store_name: string;
  store_type: string;
  store_type_name: string;
  store_type_logo_url: string | null;
  address: string | null;
  province: string;
  district: string | null;
  flavors: string[];
  stock_status: string;
  estimated_quantity: number | null;
  approval_status: string;
  created_at: string;
};

export type StoreStockUpdateInput = {
  reportId: string;
  latitude: number;
  longitude: number;
  stockStatus: 'available' | 'low_stock' | 'out_of_stock' | 'unknown';
  estimatedQuantity: number | null;
  note?: string;
  photo: File | null;
};

type StoreStockUpdateResponse = {
  status?: 'success';
  message?: string;
  error?: string;
};

async function fetchAccountReports(): Promise<{
  reports: UserReport[];
  explorer: ExplorerProgress;
}> {
  const response = await fetch('/api/account/reports', { cache: 'no-store' });
  if (!response.ok) throw new Error('request failed');

  return response.json();
}

export function useAccountReportsQuery() {
  return useQuery({
    queryKey: ['account-reports'],
    queryFn: fetchAccountReports,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    select: (data) => data.reports,
  });
}

export function useExplorerProgressQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['account-reports'],
    queryFn: fetchAccountReports,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 0,
    refetchInterval: 60_000,
    select: (data) => data.explorer,
  });
}

async function updateStoreStock({ reportId, ...body }: StoreStockUpdateInput) {
  const formData = new FormData();
  formData.set('latitude', String(body.latitude));
  formData.set('longitude', String(body.longitude));
  formData.set('stockStatus', body.stockStatus);
  formData.set(
    'estimatedQuantity',
    body.estimatedQuantity === null ? '' : String(body.estimatedQuantity)
  );
  formData.set('note', body.note ?? '');
  if (body.photo) formData.set('photo', body.photo);

  const response = await fetch(`/api/account/reports/${reportId}/stock-update`, {
    method: 'POST',
    body: formData,
  });
  const payload = (await response.json()) as StoreStockUpdateResponse;

  if (!response.ok) throw new Error(payload.error || 'อัปเดตสินค้าไม่สำเร็จ');
  return payload;
}

export function useUpdateStoreStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStoreStock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-reports'] }),
  });
}
