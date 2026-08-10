import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';

import { PendingReportsPanel } from 'src/sections/admin/pending-reports-panel';

export const metadata: Metadata = { title: 'ตรวจสอบพิกัด | Loveza Admin' };

export default function AdminReportsPage() {
  return (
    <DashboardContent maxWidth="xl">
      <PendingReportsPanel />
    </DashboardContent>
  );
}
