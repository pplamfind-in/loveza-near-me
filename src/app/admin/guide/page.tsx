import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';

import { AdminGuide } from 'src/sections/admin/admin-guide';

export const metadata: Metadata = { title: 'คู่มือระบบ | Loveza Admin' };

export default function AdminGuidePage() {
  return (
    <DashboardContent maxWidth="xl">
      <AdminGuide />
    </DashboardContent>
  );
}
