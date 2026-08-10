'use client';

import type { LandingBannerInput } from './schema';
import type { LandingBanner } from 'src/types/landing-banner';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const QUERY_KEY = ['admin-landing-banners'];

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

async function uploadImage(image: File) {
  const formData = new FormData();
  formData.set('image', image);
  const response = await fetch('/api/admin/banners/image', { method: 'POST', body: formData });
  if (!response.ok) throw new Error(await readError(response));
  return ((await response.json()) as { url: string }).url;
}

async function removeUploadedImage(url: string) {
  await fetch('/api/admin/banners/image', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(() => undefined);
}

async function fetchBanners(): Promise<LandingBanner[]> {
  const response = await fetch('/api/admin/banners');
  if (!response.ok) throw new Error(await readError(response));
  return ((await response.json()) as { banners: LandingBanner[] }).banners;
}

export function useAdminBannersQuery() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchBanners });
}

export function useSaveBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      desktopImage,
      mobileImage,
      values,
    }: {
      id?: string;
      desktopImage?: File | null;
      mobileImage?: File | null;
      values: LandingBannerInput;
    }) => {
      const uploadedUrls: string[] = [];

      try {
        const desktopUrl = desktopImage ? await uploadImage(desktopImage) : values.image_url;
        if (desktopImage) uploadedUrls.push(desktopUrl);

        const mobileUrl = mobileImage ? await uploadImage(mobileImage) : values.mobile_image_url;
        if (mobileImage && mobileUrl) uploadedUrls.push(mobileUrl);

        const response = await fetch(id ? `/api/admin/banners/${id}` : '/api/admin/banners', {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...values,
            image_url: desktopUrl,
            mobile_image_url: mobileUrl || null,
          }),
        });
        if (!response.ok) throw new Error(await readError(response));

        return (await response.json()) as { banner: LandingBanner };
      } catch (error) {
        await Promise.all(uploadedUrls.map(removeUploadedImage));
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
