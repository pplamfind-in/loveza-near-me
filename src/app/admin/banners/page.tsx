import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';

import { BannersPanel } from 'src/sections/admin/banners-panel';

export const metadata: Metadata = { title: 'จัดการ Banner | Loveza Admin' };

export default function AdminBannersPage() {
  return (
    <DashboardContent maxWidth="xl">
      <BannersPanel />
    </DashboardContent>
  );
}
