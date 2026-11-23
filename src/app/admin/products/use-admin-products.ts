'use client';

import type { ProductInput } from './schema';
import type { LovezaProduct } from 'src/types/loveza-product';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type AdminProduct = LovezaProduct & { view_count: number | null };

const ADMIN_PRODUCTS_QUERY_KEY = ['admin-products'];

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

async function fetchProducts(): Promise<AdminProduct[]> {
  const response = await fetch('/api/admin/products');
  if (!response.ok) throw new Error(await readError(response));

  const payload = (await response.json()) as { products: AdminProduct[] };
  return payload.products;
}

export function useAdminProductsQuery() {
  return useQuery({ queryKey: ADMIN_PRODUCTS_QUERY_KEY, queryFn: fetchProducts });
}

export function useSaveProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      image,
      icon,
      values,
    }: {
      id?: string;
      image?: File | null;
      icon?: File | null;
      values: ProductInput;
    }) => {
      const uploads: string[] = [];
      const upload = async (file: File) => {
        const body = new FormData();
        body.set('image', file);
        const response = await fetch('/api/admin/products/image', { method: 'POST', body });
        if (!response.ok) throw new Error(await readError(response));
        const { url } = (await response.json()) as { url: string };
        uploads.push(url);
        return url;
      };
      const cleanup = () =>
        Promise.allSettled(
          uploads.map((url) =>
            fetch('/api/admin/products/image', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
            })
          )
        );
      let imageUrl: ProductInput['image_url'];
      let iconUrl: ProductInput['icon_url'];
      try {
        imageUrl = image ? await upload(image) : values.image_url;
        iconUrl = icon ? await upload(icon) : values.icon_url;
      } catch (error) {
        await cleanup();
        throw error;
      }
      const response = await fetch(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, image_url: imageUrl, icon_url: iconUrl }),
      });
      if (!response.ok) {
        await cleanup();
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
