'use client';

import type { StoreTypeMaster } from 'src/types/store-type';

import { useQuery } from '@tanstack/react-query';

async function fetchStoreTypes(): Promise<StoreTypeMaster[]> {
  const response = await fetch('/api/store-types');
  if (!response.ok) throw new Error('request failed');
  return ((await response.json()) as { storeTypes: StoreTypeMaster[] }).storeTypes;
}

export function useStoreTypesQuery() {
  return useQuery({ queryKey: ['store-types'], queryFn: fetchStoreTypes, staleTime: 60_000 });
}
