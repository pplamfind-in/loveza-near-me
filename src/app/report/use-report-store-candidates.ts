'use client';

import { useQuery } from '@tanstack/react-query';

export type ReportStoreCandidate = {
  storeId: string;
  storeName: string;
  storeType: string;
  address: string | null;
  province: string;
  district: string | null;
  distanceM: number;
};

async function fetchReportStoreCandidates(latitude: number, longitude: number) {
  const response = await fetch(
    `/api/stores/report-candidates?lat=${latitude}&lng=${longitude}`,
    { cache: 'no-store' }
  );
  if (!response.ok) throw new Error('request failed');

  const payload = (await response.json()) as { candidates: ReportStoreCandidate[] };
  return payload.candidates;
}

export function useReportStoreCandidates(latitude?: number, longitude?: number) {
  const enabled = Number.isFinite(latitude) && Number.isFinite(longitude);

  return useQuery({
    queryKey: ['report-store-candidates', latitude, longitude],
    enabled,
    retry: false,
    queryFn: () => fetchReportStoreCandidates(latitude!, longitude!),
  });
}
