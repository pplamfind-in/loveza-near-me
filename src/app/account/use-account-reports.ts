'use client';

import { useQuery } from '@tanstack/react-query';

// ----------------------------------------------------------------------

export type UserReport = {
  id: string;
  store_name: string;
  store_type: string;
  store_type_name: string;
  address: string | null;
  province: string;
  district: string | null;
  flavors: string[];
  stock_status: string;
  estimated_quantity: number | null;
  approval_status: string;
  created_at: string;
};

async function fetchAccountReports(): Promise<UserReport[]> {
  const response = await fetch('/api/account/reports');
  if (!response.ok) throw new Error('request failed');

  const payload = (await response.json()) as { reports: UserReport[] };
  return payload.reports;
}

export function useAccountReportsQuery() {
  return useQuery({ queryKey: ['account-reports'], queryFn: fetchAccountReports });
}
