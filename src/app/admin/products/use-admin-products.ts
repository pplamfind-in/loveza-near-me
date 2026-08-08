'use client';

import type { ProductInput } from './schema';
import type { LovezaProduct } from 'src/types/loveza-product';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ADMIN_PRODUCTS_QUERY_KEY = ['admin-products'];

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

async function fetchProducts(): Promise<LovezaProduct[]> {
  const response = await fetch('/api/admin/products');
  if (!response.ok) throw new Error(await readError(response));

  const payload = (await response.json()) as { products: LovezaProduct[] };
  return payload.products;
}

export function useAdminProductsQuery() {
  return useQuery({ queryKey: ADMIN_PRODUCTS_QUERY_KEY, queryFn: fetchProducts });
}

export function useSaveProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, image, values }: { id?: string; image?: File | null; values: ProductInput }) => {
      let uploadedUrl: string | null = null;

      if (image) {
        const formData = new FormData();
        formData.set('image', image);
        const uploadResponse = await fetch('/api/admin/products/image', {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error(await readError(uploadResponse));

        const uploadPayload = (await uploadResponse.json()) as { url: string };
        uploadedUrl = uploadPayload.url;
      }

      const response = await fetch(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, image_url: uploadedUrl ?? values.image_url }),
      });
      if (!response.ok) {
        if (uploadedUrl) {
          await fetch('/api/admin/products/image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: uploadedUrl }),
          }).catch(() => undefined);
        }
        throw new Error(await readError(response));
      }
      return (await response.json()) as { product: LovezaProduct };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY }),
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY }),
  });
}
