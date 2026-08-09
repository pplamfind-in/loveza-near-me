import type { Metadata } from 'next';

import { DashboardContent } from 'src/layouts/dashboard';

import { StoreTypesPanel } from 'src/sections/admin/store-types-panel';

export const metadata: Metadata = { title: 'Master ประเภทร้าน | Loveza Admin' };

export default function AdminStoreTypesPage() {
  return (
    <DashboardContent maxWidth="xl">
      <StoreTypesPanel />
    </DashboardContent>
  );
}
