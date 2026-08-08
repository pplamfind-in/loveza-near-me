'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ----------------------------------------------------------------------

export type PendingReportProfile = { display_name: string | null; email: string | null };

export type PendingReport = {
  id: string;
  store_name: string;
  address: string | null;
  district: string | null;
  province: string;
  stock_status: string;
  estimated_quantity: number | null;
  flavors: string[];
  photo_url: string | null;
  note: string | null;
  created_at: string;
  profiles: PendingReportProfile | PendingReportProfile[] | null;
};

const ADMIN_REPORTS_QUERY_KEY = ['admin-reports'];

async function fetchPendingReports(): Promise<PendingReport[]> {
  const response = await fetch('/api/admin/reports');
  if (!response.ok) throw new Error('request failed');

  const payload = (await response.json()) as { reports: PendingReport[] };
  return payload.reports;
}

export function useAdminReportsQuery() {
  return useQuery({ queryKey: ADMIN_REPORTS_QUERY_KEY, queryFn: fetchPendingReports });
}

export function useReportDecisionMutation(decision: 'approve' | 'reject') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/reports/${id}/${decision}`, { method: 'POST' });
      if (!response.ok) throw new Error('request failed');
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<PendingReport[]>(ADMIN_REPORTS_QUERY_KEY, (current) =>
        current?.filter((report) => report.id !== id)
      );
    },
  });
}
