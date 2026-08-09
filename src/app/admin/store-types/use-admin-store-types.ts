'use client';

import type { StoreTypeMasterInput } from './schema';
import type { StoreTypeMaster } from 'src/types/store-type';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const QUERY_KEY = ['admin-store-types'];

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

async function fetchStoreTypes(): Promise<StoreTypeMaster[]> {
  const response = await fetch('/api/admin/store-types');
  if (!response.ok) throw new Error(await readError(response));
  return ((await response.json()) as { storeTypes: StoreTypeMaster[] }).storeTypes;
}

export function useAdminStoreTypesQuery() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchStoreTypes });
}

export function useSaveStoreTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      logo,
      values,
    }: {
      id?: string;
      logo?: File | null;
      values: StoreTypeMasterInput;
    }) => {
      let uploadedUrl: string | null = null;

      if (logo) {
        const formData = new FormData();
        formData.set('image', logo);
        const uploadResponse = await fetch('/api/admin/store-types/image', {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error(await readError(uploadResponse));
        uploadedUrl = ((await uploadResponse.json()) as { url: string }).url;
      }

      const response = await fetch(id ? `/api/admin/store-types/${id}` : '/api/admin/store-types', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, logo_url: uploadedUrl ?? values.logo_url }),
      });

      if (!response.ok) {
        if (uploadedUrl) {
          await fetch('/api/admin/store-types/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: uploadedUrl }),
          }).catch(() => undefined);
        }
        throw new Error(await readError(response));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteStoreTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/store-types/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
