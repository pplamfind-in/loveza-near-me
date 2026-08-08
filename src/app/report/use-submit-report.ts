'use client';

import type { ReportFormState } from './schema';

import { useMutation } from '@tanstack/react-query';

async function submitReport(formData: FormData): Promise<ReportFormState> {
  const response = await fetch('/api/reports', { method: 'POST', body: formData });
  return (await response.json()) as ReportFormState;
}

export function useSubmitReportMutation() {
  return useMutation({ mutationFn: submitReport });
}
